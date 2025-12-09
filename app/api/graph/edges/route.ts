import { graphEdges } from "@/lib/store"
import type { GraphEdge } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const edgeData = await req.json()

    const newEdge: GraphEdge = {
      id: `edge-${Date.now()}`,
      policy_pack_id: edgeData.policy_pack_id,
      source_node_id: edgeData.source_node_id,
      target_node_id: edgeData.target_node_id,
      relationship: edgeData.relationship,
      properties: edgeData.properties || {},
    }

    graphEdges.push(newEdge)

    return Response.json({ success: true, data: newEdge })
  } catch (error) {
    console.error("Create edge error:", error)
    return Response.json({ success: false, error: "Failed to create edge" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const edgeIndex = graphEdges.findIndex((e) => e.id === id)

    if (edgeIndex === -1) {
      return Response.json({ success: false, error: "Edge not found" }, { status: 404 })
    }

    graphEdges.splice(edgeIndex, 1)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete edge error:", error)
    return Response.json({ success: false, error: "Failed to delete edge" }, { status: 500 })
  }
}
