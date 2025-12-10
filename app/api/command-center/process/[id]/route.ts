import { query } from "@/lib/supabase"
import { generateStructuredOutput } from "@/lib/openai-client"
import { generateEmbedding, cosineSimilarity } from "@/lib/embeddings"
import { getPolicyChunks } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"
import { z } from "zod"

const decisionSchema = z.object({
  outcome: z.enum(["APPROVED", "REVIEW", "BLOCKED"]),
  confidence: z.number().min(0).max(1),
  risk_score: z.number().min(0).max(100),
  reasoning: z.string(),
  matched_policies: z.array(z.string()),
  missing_information: z.array(z.string()).optional(),
  recommended_actions: z.array(z.string()).optional(),
})

const refinementSchema = z.object({
  needs_refinement: z.boolean(),
  alternative_queries: z.array(z.string()).max(3),
  reasoning: z.string(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { confidenceThreshold = 0.7 } = await req.json()

  try {
    // Get pending decision
    const { data: pendingData } = await query("SELECT * FROM pending_decisions WHERE id = $1", [id])
    const pending = pendingData?.[0]

    if (!pending) {
      return Response.json({ success: false, error: "Pending decision not found" }, { status: 404 })
    }

    // Update status to processing
    await query("UPDATE pending_decisions SET status = 'processing' WHERE id = $1", [id])

    const maxAttempts = 3
    let attempt = 1
    let bestDecision: any = null
    let searchHistory: string[] = []

    let eventDescription = `Event: ${pending.event_type}\nData: ${JSON.stringify(pending.event_data, null, 2)}`
    searchHistory.push(eventDescription)

    // Get graph context
    const { nodes, edges } = await getGraph(pending.policy_pack_id)
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

    // Agentic loop
    while (attempt <= maxAttempts) {
      const eventEmbedding = await generateEmbedding(eventDescription)
      const allChunks = await getPolicyChunks(pending.policy_pack_id)

      const rankedChunks = allChunks
        .filter((chunk) => chunk.embedding && Array.isArray(chunk.embedding))
        .map((chunk) => ({
          content: chunk.content,
          section_ref: chunk.section_ref,
          similarity: cosineSimilarity(eventEmbedding, chunk.embedding!),
          priority: chunk.metadata?.priority || "medium",
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5 + (attempt - 1) * 2)

      const decision = await generateStructuredOutput({
        model: "gpt-5.1-2025-11-13",
        schema: decisionSchema,
        maxTokens: 2000,
        prompt: `You are an agentic compliance decision system (Attempt ${attempt}/${maxAttempts}).

EVENT:
Type: ${pending.event_type}
Data: ${JSON.stringify(pending.event_data, null, 2)}

RELEVANT POLICY TEXT (Linear RAG - Top ${rankedChunks.length}):
${rankedChunks.map((c, i) => `${i + 1}. [${c.section_ref}] (similarity: ${c.similarity.toFixed(3)})
${c.content}`).join("\n\n")}

POLICY KNOWLEDGE GRAPH (Graph RAG - ${nodes.length} nodes, ${edges.length} edges):
${graphContext}

Analyze and decide:
1. Outcome: APPROVED / REVIEW / BLOCKED
2. Confidence (0.0-1.0): Be honest - if unclear, set low confidence
3. Risk score (0-100)
4. Reasoning with policy citations
5. If confidence < ${confidenceThreshold}, list missing_information
6. Matched policies`,
      })

      if (!bestDecision || decision.confidence > bestDecision.confidence) {
        bestDecision = {
          ...decision,
          attempt,
          linear_rag_chunks: rankedChunks.length,
          graph_rag_nodes: nodes.length,
          search_queries: [...searchHistory],
        }
      }

      if (decision.confidence >= confidenceThreshold) break

      if (attempt < maxAttempts) {
        const refinement = await generateStructuredOutput({
          model: "gpt-5.1-2025-11-13",
          schema: refinementSchema,
          maxTokens: 500,
          prompt: `Low confidence (${decision.confidence}). Generate alternative search queries.
Event: ${pending.event_type}
Missing: ${decision.missing_information?.join(", ") || "unclear"}`,
        })

        if (refinement.needs_refinement && refinement.alternative_queries.length > 0) {
          eventDescription = refinement.alternative_queries[0]
          searchHistory.push(eventDescription)
        } else {
          break
        }
      }

      attempt++
    }

    const requiresHumanReview = bestDecision.confidence < confidenceThreshold
    if (requiresHumanReview && bestDecision.outcome === "APPROVED") {
      bestDecision.outcome = "REVIEW"
      bestDecision.reasoning += `\n\n[SYSTEM]: Low confidence - routing to human review.`
    }

    // Create event first (required by schema)
    const eventSql = `
      INSERT INTO events (event_type, entity_id, payload)
      VALUES ($1, $2, $3)
      RETURNING id
    `

    const { data: eventData, error: eventError } = await query(eventSql, [
      pending.event_type,
      pending.event_data?.vendor?.name || pending.event_data?.customer?.id || "unknown",
      JSON.stringify(pending.event_data),
    ])

    if (eventError) {
      console.error("Event creation error:", eventError)
      throw new Error("Failed to create event: " + String(eventError))
    }

    const eventId = eventData?.[0]?.id
    if (!eventId) {
      throw new Error("No event ID returned")
    }

    // Store decision
    const decisionSql = `
      INSERT INTO decisions (
        event_id, decision, risk_score, ai_explanation, 
        matched_conditions, policy_pack_version,
        pending_decision_id, confidence, requires_human_review,
        agent_attempts, agent_search_queries
      ) VALUES ($1, $2, $3, $4, $5, '1.0', $6, $7, $8, $9, $10)
      RETURNING id
    `

    const { data: decisionData, error: decisionError } = await query(decisionSql, [
      eventId,
      bestDecision.outcome,
      bestDecision.risk_score,
      bestDecision.reasoning,
      JSON.stringify(bestDecision.matched_policies),
      id,
      bestDecision.confidence,
      requiresHumanReview,
      bestDecision.attempt,
      bestDecision.search_queries,
    ])

    if (decisionError) {
      console.error("Decision creation error:", decisionError)
      throw new Error("Failed to create decision: " + String(decisionError))
    }

    // Update pending decision
    await query(
      `UPDATE pending_decisions 
       SET status = 'completed', processed_at = NOW(), 
           agent_attempts = $1, agent_queries_used = $2
       WHERE id = $3`,
      [bestDecision.attempt, bestDecision.search_queries, id]
    )

    // If requires review, create review item
    if (requiresHumanReview) {
      await query(
        `INSERT INTO review_items (
          event_id, decision_id, entity_id, entity_name, confidence_score, 
          recommended_action, reasoning, confidence, missing_information, 
          auto_routed, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'pending')`,
        [
          eventId,
          decisionData?.[0]?.id,
          pending.event_data?.vendor?.name || pending.event_data?.customer?.id || "unknown",
          pending.event_data?.vendor?.name || pending.event_data?.customer?.name || "Unknown Entity",
          bestDecision.confidence,
          bestDecision.outcome,
          bestDecision.reasoning,
          bestDecision.confidence,
          bestDecision.missing_information || []
        ]
      )
    }

    return Response.json({
      success: true,
      data: {
        decision: {
          outcome: bestDecision.outcome,
          confidence: bestDecision.confidence,
          risk_score: bestDecision.risk_score,
          reasoning: bestDecision.reasoning,
          matched_policies: bestDecision.matched_policies,
          requires_human_review: requiresHumanReview,
        },
        agent_metadata: {
          attempts: bestDecision.attempt,
          queries_used: bestDecision.search_queries,
        },
      },
    })
  } catch (error) {
    console.error("Process decision error:", error)
    await query("UPDATE pending_decisions SET status = 'failed', processing_error = $1 WHERE id = $2", [
      String(error),
      id,
    ])
    return Response.json({ success: false, error: "Failed to process decision" }, { status: 500 })
  }
}
