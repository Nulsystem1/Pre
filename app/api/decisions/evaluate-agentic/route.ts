import { z } from "zod"
import { getPolicyChunks } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"
import { generateEmbedding } from "@/lib/embeddings"
import { generateStructuredOutput } from "@/lib/openai-client"
import { cosineSimilarity } from "@/lib/embeddings"
import { applyConfidenceGuardrail } from "@/lib/decision-guardrails"
import { buildReviewQueuePayload } from "@/lib/review-queue-payload"

// Decision schema with confidence
const decisionSchema = z.object({
  outcome: z.enum(["APPROVED", "REVIEW", "BLOCKED"]),
  confidence: z.number().min(0).max(1).describe("Confidence level: 0.0 to 1.0"),
  risk_score: z.number().min(0).max(100),
  reasoning: z.string(),
  matched_policies: z.array(z.string()),
  missing_information: z.array(z.string()).optional().describe("What information is missing to make a confident decision"),
  recommended_actions: z.array(z.string()).optional(),
})

// Query refinement schema
const refinementSchema = z.object({
  needs_refinement: z.boolean(),
  alternative_queries: z.array(z.string()).max(3).describe("Alternative search queries to find more relevant policies"),
  reasoning: z.string(),
})

const HUMAN_REVIEW_THRESHOLD = 0.8 // Below 80% confidence → requires human review

export async function POST(req: Request) {
  try {
    const {
      eventType,
      eventData,
      policyPackId,
      confidenceThreshold = HUMAN_REVIEW_THRESHOLD,
      additionalContext,
    } = await req.json()

    if (!eventType || !eventData) {
      return Response.json(
        { success: false, error: "Missing eventType or eventData" },
        { status: 400 }
      )
    }

    // Guardrail: policy pack required for RAG
    if (!policyPackId) {
      return Response.json(
        { success: false, error: "policyPackId is required for evaluation" },
        { status: 400 }
      )
    }

    // Require at least one ingested policy chunk (Linear RAG)
    const allChunks = await getPolicyChunks(policyPackId)
    if (allChunks.length === 0) {
      return Response.json(
        {
          success: false,
          error:
            "No policy documents have been ingested for this policy pack. Add documents in Policy Studio and run Ingest before validating.",
        },
        { status: 400 }
      )
    }

    // Normalize embedding (pg may return vector as string or array)
    const toEmbedding = (c: (typeof allChunks)[0]): number[] | null => {
      const e = c.embedding
      if (Array.isArray(e)) return e as number[]
      if (typeof e === "string") {
        try {
          const arr = JSON.parse(e) as unknown
          return Array.isArray(arr) ? (arr as number[]) : null
        } catch {
          return null
        }
      }
      return null
    }

    const maxAttempts = 3
    let attempt = 1
    let bestDecision: any = null
    let searchHistory: string[] = []

    // Initial event description
    let eventDescription = `Event: ${eventType}\nData: ${JSON.stringify(eventData, null, 2)}`
    searchHistory.push(eventDescription)

    // Get graph context once (doesn't change between attempts)
    const { nodes, edges } = await getGraph(policyPackId)
    const graphContext = nodes
      .map((n, i) => {
        const outgoing = edges
          .filter((e) => e.source_node_id === n.id)
          .map((e) => {
            const target = nodes.find((t) => t.id === e.target_node_id)
            return `→ [${e.relationship}] → ${target?.label}`
          })
          .join(", ")
        return `${i + 1}. [${n.node_type}] ${n.label}${outgoing ? ` ${outgoing}` : ""}`
      })
      .slice(0, 25)
      .join("\n")

    // Agentic loop: Try up to 3 times with refined queries
    while (attempt <= maxAttempts) {

      // Step 1: Generate embedding and rank policy chunks (chunks already loaded above)
      const eventEmbedding = await generateEmbedding(eventDescription)
      const chunkEmbeddings = allChunks
        .map((chunk) => ({ chunk, embedding: toEmbedding(chunk) }))
        .filter((x): x is { chunk: (typeof allChunks)[0]; embedding: number[] } => x.embedding !== null)
      const rankedChunks = chunkEmbeddings
        .map(({ chunk, embedding }) => ({
          content: chunk.content,
          section_ref: chunk.section_ref,
          similarity: cosineSimilarity(eventEmbedding, embedding),
          priority: (chunk.metadata as Record<string, string> | undefined)?.priority || "medium",
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5 + (attempt - 1) * 2) // Increase chunks with each attempt

      // Step 2: AI Agent makes decision (with guardrails)
      const decision = await generateStructuredOutput({
        model: "gpt-5.1-2025-11-13",
        schema: decisionSchema,
        maxTokens: 1500,
        prompt: `GUARDRAILS: You are a compliance decision agent only. You must output ONLY a valid JSON decision. Do not include any narrative, advice, or content outside the schema. Base your decision solely on the event data and the policy context provided. Do not infer or invent policy.

You are an agentic compliance decision system (Attempt ${attempt}/${maxAttempts}).

# MANDATORY JSON OUTPUT FORMAT SCHEMA
Analyze this event and provide a decision with confidence score.

EVENT:
Type: ${eventType}
Data: ${JSON.stringify(eventData, null, 2)}
${typeof additionalContext === "string" && additionalContext.trim()
  ? `

SUPPLEMENTARY INFORMATION FROM REVIEWER (notes and uploaded documents — use this to re-check missing fields and recommended actions; it may satisfy gaps and increase confidence):
---
${additionalContext.trim()}
---`
  : ""}

RELEVANT POLICY TEXT (Linear RAG - Top ${rankedChunks.length} matches):
${rankedChunks.map((c, i) => `${i + 1}. [${c.section_ref}] (similarity: ${c.similarity.toFixed(3)}, priority: ${c.priority})
${c.content}`).join("\n\n")}

POLICY KNOWLEDGE GRAPH (Graph RAG - ${nodes.length} nodes, ${edges.length} edges):
${graphContext}

${searchHistory.length > 1 ? `\nPREVIOUS SEARCH ATTEMPTS:
${searchHistory.slice(0, -1).map((q, i) => `${i + 1}. ${q.substring(0, 100)}`).join("\n")}` : ""}

INSTRUCTIONS:
1. Analyze the event against policy context
2. Determine outcome: APPROVED / REVIEW / BLOCKED
3. Calculate risk score (0-100)
4. **CRITICAL**: Set confidence (0.0-1.0):
   - 0.9-1.0: Very confident, clear policy match
   - 0.7-0.9: Confident, policies apply
   - 0.5-0.7: Moderate, some ambiguity
   - <0.5: Low confidence, insufficient information
5. If confidence < ${confidenceThreshold}, list missing_information
6. Cite specific matched_policies
7. Suggest recommended_actions
${typeof additionalContext === "string" && additionalContext.trim()
  ? `
When SUPPLEMENTARY INFORMATION is provided: re-evaluate against it. If it addresses previously missing fields or satisfies policy requirements, reduce missing_information accordingly and increase confidence. Update recommended_actions if the new information changes what is needed.`
  : ""}

Be honest about confidence - if policies are unclear or missing, set low confidence.`,
      })

     
      // Store best decision (highest confidence)
      if (!bestDecision || decision.confidence > bestDecision.confidence) {
        bestDecision = {
          ...decision,
          attempt,
          linear_rag_chunks: rankedChunks.length,
          graph_rag_nodes: nodes.length,
          graph_rag_edges: edges.length,
          search_queries_used: [...searchHistory],
        }
      }

      // Check if confident enough
      if (decision.confidence >= confidenceThreshold) {
        break
      }

      // If not last attempt, refine the query
      if (attempt < maxAttempts) {
        
        const refinement = await generateStructuredOutput({
          model: "gpt-5.1-2025-11-13",
          schema: refinementSchema,
          maxTokens: 500,
          prompt: `Current decision has low confidence (${decision.confidence}).
          
Event: ${eventType}
Data: ${JSON.stringify(eventData, null, 2)}

Missing information: ${decision.missing_information?.join(", ") || "unclear"}

Generate 2-3 alternative search queries to find more relevant policies.
Focus on specific aspects that are unclear or need more policy context.

Examples:
- "vendor onboarding sanctions screening requirements"
- "high-risk country transaction limits and escalation"
- "insurance requirements for international vendors"`,
        })

        if (refinement.needs_refinement && refinement.alternative_queries.length > 0) {
          // Use the first alternative query for next attempt
          eventDescription = refinement.alternative_queries[0]
          searchHistory.push(eventDescription)
        } else {
          break // No refinement possible
        }
      }

      attempt++
    }

    // Final decision logic (guardrail: low confidence → human review; APPROVED below threshold → REVIEW)
    const finalDecision = bestDecision
    const { outcome: guardrailOutcome, requiresHumanReview } = applyConfidenceGuardrail(
      finalDecision.outcome,
      finalDecision.confidence,
      confidenceThreshold
    )
    finalDecision.outcome = guardrailOutcome
    if (requiresHumanReview && guardrailOutcome === "REVIEW" && bestDecision.outcome === "APPROVED") {
      finalDecision.reasoning += `\n\n[SYSTEM]: Low confidence (${finalDecision.confidence.toFixed(2)} < ${confidenceThreshold}) - routing to human review.`
    }

    const missingInfo = finalDecision.missing_information || []
    const reviewQueuePayload =
      finalDecision.outcome === "REVIEW"
        ? buildReviewQueuePayload("REVIEW", missingInfo)
        : null

    const data: Record<string, unknown> = {
      event_type: eventType,
      event_data: eventData,
      outcome: finalDecision.outcome,
      confidence: finalDecision.confidence,
      risk_score: finalDecision.risk_score,
      reasoning: finalDecision.reasoning,
      matched_policies: finalDecision.matched_policies,
      missing_information: missingInfo,
      recommended_actions: finalDecision.recommended_actions || [],
      agent_metadata: {
        attempts: finalDecision.attempt,
        total_attempts: maxAttempts,
        confidence_threshold: confidenceThreshold,
        requires_human_review: requiresHumanReview,
        search_queries: finalDecision.search_queries_used,
      },
      rag_context: {
        linear_rag_chunks: finalDecision.linear_rag_chunks,
        graph_rag_nodes: finalDecision.graph_rag_nodes,
        graph_rag_edges: finalDecision.graph_rag_edges,
      },
    }
    if (reviewQueuePayload) {
      data.review_queue_payload = reviewQueuePayload
    }

    return Response.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Agentic decision evaluation error:", error)
    const message = error instanceof Error ? error.message : String(error)
    const isEmbeddingError =
      /embedding|openai|api_key|rate limit/i.test(message) || message.includes("Failed to generate embedding")
    const userError = isEmbeddingError
      ? "Evaluation failed: embedding service error. Ensure OPENAI_API_KEY is set and that policy documents have been ingested for this policy pack (Policy Studio → Ingest)."
      : "Failed to evaluate decision"
    return Response.json(
      { success: false, error: userError },
      { status: isEmbeddingError ? 503 : 500 }
    )
  }
}

