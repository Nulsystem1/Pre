import { z } from "zod"
import { getPolicyChunks } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"
import { generateEmbedding } from "@/lib/embeddings"
import { generateStructuredOutput } from "@/lib/openai-client"
import { cosineSimilarity } from "@/lib/embeddings"

// Decision schema
const decisionSchema = z.object({
  outcome: z.enum(["APPROVED", "REVIEW", "BLOCKED"]),
  risk_score: z.number().min(0).max(100),
  reasoning: z.string(),
  matched_policies: z.array(z.string()),
  recommended_actions: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const { eventType, eventData, policyPackId } = await req.json()

    if (!eventType || !eventData) {
      return Response.json(
        { success: false, error: "Missing eventType or eventData" },
        { status: 400 }
      )
    }

    // Step 1: Generate embedding for the event
    const eventDescription = `Event: ${eventType}\nData: ${JSON.stringify(eventData, null, 2)}`
    const eventEmbedding = await generateEmbedding(eventDescription)

    // Step 2: Linear RAG - Retrieve relevant policy chunks via semantic search
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
      .slice(0, 5) // Top 5 most relevant chunks

    // Step 3: Graph RAG - Retrieve knowledge graph
    const { nodes, edges } = await getGraph(policyPackId)

    // Build graph context showing relevant paths
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
      .slice(0, 20) // Top 20 nodes
      .join("\n")

    // Step 4: AI Agent makes decision using both RAG contexts
    const decision = await generateStructuredOutput({
      model: "gpt-5.1-2025-11-13",
      schema: decisionSchema,
      maxTokens: 2000,
      prompt: `You are a compliance decision agent. Analyze this event against the policy context and make a decision.

EVENT:
Type: ${eventType}
Data: ${JSON.stringify(eventData, null, 2)}

RELEVANT POLICY TEXT (Linear RAG - Top 5 matches):
${rankedChunks.map((c, i) => `${i + 1}. [${c.section_ref}] (similarity: ${c.similarity.toFixed(3)}, priority: ${c.priority})
${c.content}`).join("\n\n")}

POLICY KNOWLEDGE GRAPH (Graph RAG):
${graphContext}

DECISION RULES:
- APPROVED: Event complies with all policies, low risk
- REVIEW: Event requires manual review due to medium risk or missing information
- BLOCKED: Event violates critical policies or high risk

Based on the policy context above, make a decision for this event:
1. Determine the outcome (APPROVED, REVIEW, or BLOCKED)
2. Calculate a risk score (0-100)
3. Provide clear reasoning citing specific policy sections
4. List which policies were matched
5. Optionally suggest recommended actions

Return your decision as JSON.`,
    })

    // Step 5: Store decision (simplified - just return for now)
    return Response.json({
      success: true,
      data: {
        event_type: eventType,
        event_data: eventData,
        outcome: decision.outcome,
        risk_score: decision.risk_score,
        reasoning: decision.reasoning,
        matched_policies: decision.matched_policies,
        recommended_actions: decision.recommended_actions || [],
        rag_context: {
          linear_rag_chunks: rankedChunks.length,
          graph_rag_nodes: nodes.length,
          graph_rag_edges: edges.length,
        },
      },
    })
  } catch (error) {
    console.error("Decision evaluation error:", error)
    return Response.json(
      { success: false, error: "Failed to evaluate decision" },
      { status: 500 }
    )
  }
}

