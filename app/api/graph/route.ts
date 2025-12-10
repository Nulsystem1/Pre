import { getGraph, getGraphNodes, getGraphEdges } from "@/lib/neo4j"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const policyPackId = searchParams.get("policyPackId")

    if (!policyPackId) {
      return Response.json({ success: false, error: "policyPackId is required" }, { status: 400 })
    }

    const graph = await getGraph(policyPackId)

    return Response.json({
      success: true,
      data: graph,
    })
  } catch (error) {
    console.error("Get graph error:", error)
    return Response.json({ success: false, error: "Failed to get graph" }, { status: 500 })
  }
}
