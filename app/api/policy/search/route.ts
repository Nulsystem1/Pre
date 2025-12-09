import { generateText } from "ai"
import { policyChunks, graphNodes, graphEdges } from "@/lib/store"

export async function POST(req: Request) {
  try {
    const { policyPackId, query } = await req.json()

    if (!query) {
      return Response.json({ success: false, error: "Missing query" }, { status: 400 })
    }

    // Get chunks for this policy pack (or all if no pack specified)
    const relevantChunks = policyPackId ? policyChunks.filter((c) => c.policy_pack_id === policyPackId) : policyChunks

    // Get graph for context
    const relevantNodes = policyPackId ? graphNodes.filter((n) => n.policy_pack_id === policyPackId) : graphNodes

    const relevantEdges = policyPackId ? graphEdges.filter((e) => e.policy_pack_id === policyPackId) : graphEdges

    // Build context from chunks and graph
    const chunksContext = relevantChunks.map((c) => `[${c.section_ref}]: ${c.content}`).join("\n\n")

    const graphContext = relevantNodes
      .map((n) => `- ${n.node_type}: "${n.label}" (from: "${n.source_text}")`)
      .join("\n")

    // Use AI to answer based on RAG context
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt: `You are a compliance policy expert. Answer the following question based ONLY on the provided policy context.

POLICY CHUNKS:
${chunksContext}

POLICY GRAPH ENTITIES:
${graphContext}

USER QUESTION: ${query}

Provide a clear, accurate answer based on the policy content. If the information is not in the context, say so.`,
      maxOutputTokens: 1000,
    })

    return Response.json({
      success: true,
      data: {
        answer: text,
        sources: relevantChunks.slice(0, 3).map((c) => ({
          section: c.section_ref,
          content: c.content.substring(0, 200) + "...",
        })),
      },
    })
  } catch (error) {
    console.error("Policy search error:", error)
    return Response.json({ success: false, error: "Failed to search policy" }, { status: 500 })
  }
}
