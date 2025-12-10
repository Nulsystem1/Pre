import { z } from "zod"
import { getPolicyChunks } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"
import { generateEmbedding } from "@/lib/embeddings"
import { generateStructuredOutput } from "@/lib/openai-client"
import { cosineSimilarity } from "@/lib/embeddings"

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

export async function POST(req: Request) {
  try {
    const { eventType, eventData, policyPackId, confidenceThreshold = 0.7 } = await req.json()

    if (!eventType || !eventData) {
      return Response.json(
        { success: false, error: "Missing eventType or eventData" },
        { status: 400 }
      )
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
      console.log(`\n🤖 Agent Attempt ${attempt}/${maxAttempts}`)
      console.log(`Search query: ${eventDescription.substring(0, 100)}...`)

      // Step 1: Generate embedding and retrieve policy chunks
      const eventEmbedding = await generateEmbedding(eventDescription)
      const allChunks = await getPolicyChunks(policyPackId)
      
      const rankedChunks = allChunks
        .filter((chunk) => chunk.embedding && Array.isArray(chunk.embedding))
        .map((chunk) => ({
          content: chunk.content,
          section_ref: chunk.section_ref,
          similarity: cosineSimilarity(eventEmbedding, chunk.embedding!),
          priority: chunk.metadata?.priority || "medium",
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5 + (attempt - 1) * 2) // Increase chunks with each attempt

      // Step 2: AI Agent makes decision
      const decision = await generateStructuredOutput({
        model: "gpt-5.1-2025-11-13",
        schema: decisionSchema,
        maxTokens: 2000,
        prompt: `You are an agentic compliance decision system (Attempt ${attempt}/${maxAttempts}).

# MANDATORY JSON OUTPUT FORMAT SCHEMA
Analyze this event and provide a decision with confidence score.

EVENT:
Type: ${eventType}
Data: ${JSON.stringify(eventData, null, 2)}

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

Be honest about confidence - if policies are unclear or missing, set low confidence.`,
      })

      console.log(`Decision: ${decision.outcome}, Confidence: ${decision.confidence}, Risk: ${decision.risk_score}`)

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
        console.log(`✅ Confident decision reached on attempt ${attempt}`)
        break
      }

      // If not last attempt, refine the query
      if (attempt < maxAttempts) {
        console.log(`⚠️ Low confidence (${decision.confidence}), refining search...`)
        
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
          console.log(`🔄 Refined query: ${eventDescription}`)
        } else {
          break // No refinement possible
        }
      }

      attempt++
    }

    // Final decision logic
    const finalDecision = bestDecision
    const requiresHumanReview = finalDecision.confidence < confidenceThreshold

    // If confidence is too low, force REVIEW
    if (requiresHumanReview && finalDecision.outcome === "APPROVED") {
      finalDecision.outcome = "REVIEW"
      finalDecision.reasoning += `\n\n[SYSTEM]: Low confidence (${finalDecision.confidence.toFixed(2)} < ${confidenceThreshold}) - routing to human review.`
    }

    return Response.json({
      success: true,
      data: {
        event_type: eventType,
        event_data: eventData,
        outcome: finalDecision.outcome,
        confidence: finalDecision.confidence,
        risk_score: finalDecision.risk_score,
        reasoning: finalDecision.reasoning,
        matched_policies: finalDecision.matched_policies,
        missing_information: finalDecision.missing_information || [],
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
      },
    })
  } catch (error) {
    console.error("Agentic decision evaluation error:", error)
    return Response.json(
      { success: false, error: "Failed to evaluate decision" },
      { status: 500 }
    )
  }
}

