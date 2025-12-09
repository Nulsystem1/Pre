import { graphNodes } from "@/lib/store"
import type { GraphNode } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const nodeData = await req.json()

    const newNode: GraphNode = {
      id: `node-${Date.now()}`,
      policy_pack_id: nodeData.policy_pack_id,
      node_type: nodeData.node_type,
      label: nodeData.label,
      properties: nodeData.properties || {},
      source_text: nodeData.source_text || "",
      position: nodeData.position || { x: 100, y: 100 },
    }

    graphNodes.push(newNode)

    return Response.json({ success: true, data: newNode })
  } catch (error) {
    console.error("Create node error:", error)
    return Response.json({ success: false, error: "Failed to create node" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json()
    const nodeIndex = graphNodes.findIndex((n) => n.id === id)

    if (nodeIndex === -1) {
      return Response.json({ success: false, error: "Node not found" }, { status: 404 })
    }

    // Update position if provided
    if (updates.position) {
      graphNodes[nodeIndex].position = updates.position
    }

    // Update other fields
    if (updates.label) graphNodes[nodeIndex].label = updates.label
    if (updates.properties) graphNodes[nodeIndex].properties = updates.properties

    return Response.json({ success: true, data: graphNodes[nodeIndex] })
  } catch (error) {
    console.error("Update node error:", error)
    return Response.json({ success: false, error: "Failed to update node" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const nodeIndex = graphNodes.findIndex((n) => n.id === id)

    if (nodeIndex === -1) {
      return Response.json({ success: false, error: "Node not found" }, { status: 404 })
    }

    graphNodes.splice(nodeIndex, 1)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete node error:", error)
    return Response.json({ success: false, error: "Failed to delete node" }, { status: 500 })
  }
}
