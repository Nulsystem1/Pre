import { generateText } from "@/lib/openai-client"
import { getPolicyChunks } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"

export async function POST(req: Request) {
  try {
    const { policyPackId, query } = await req.json()

    if (!query) {
      return Response.json({ success: false, error: "Missing query" }, { status: 400 })
    }

    // Get chunks for this policy pack
    const relevantChunks = policyPackId 
      ? await getPolicyChunks(policyPackId)
      : []

    // Get graph for context
    const { nodes: relevantNodes } = policyPackId
      ? await getGraph(policyPackId)
      : { nodes: [] }

    // Build context from chunks and graph
    const chunksContext = relevantChunks.map((c) => `[${c.section_ref}]: ${c.content}`).join("\n\n")

    const graphContext = relevantNodes
      .map((n) => `- ${n.node_type}: "${n.label}" (from: "${n.source_text || ""}")`)
      .join("\n")

    // Use AI to answer based on RAG context
    const text = await generateText({
      model: "gpt-4o",
      prompt: `You are a compliance policy expert. Answer the following question based ONLY on the provided policy context.

POLICY CHUNKS:
${chunksContext}

POLICY GRAPH ENTITIES:
${graphContext}

USER QUESTION: ${query}

Provide a clear, accurate answer based on the policy content. If the information is not in the context, say so.`,
      maxTokens: 1000,
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
