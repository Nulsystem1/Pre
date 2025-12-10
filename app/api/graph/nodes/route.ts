import { createGraphNode, getSession } from "@/lib/neo4j"
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

    await createGraphNode(newNode)

    return Response.json({ success: true, data: newNode })
  } catch (error) {
    console.error("Create node error:", error)
    return Response.json({ success: false, error: "Failed to create node" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json()

    const session = getSession()
    try {
      // Update node in Neo4j
      const updateFields = []
      if (updates.position) {
        updateFields.push("n.position_x = $position_x", "n.position_y = $position_y")
      }
      if (updates.label) {
        updateFields.push("n.label = $label")
      }
      if (updates.properties) {
        updateFields.push("n.properties = $properties")
      }

      if (updateFields.length === 0) {
        return Response.json({ success: false, error: "No updates provided" }, { status: 400 })
      }

      await session.run(
        `
        MATCH (n:GraphNode {id: $id})
        SET ${updateFields.join(", ")}
        RETURN n
        `,
        {
          id,
          position_x: updates.position?.x,
          position_y: updates.position?.y,
          label: updates.label,
          properties: updates.properties ? JSON.stringify(updates.properties) : undefined,
        }
      )

      return Response.json({ success: true, data: { id, ...updates } })
    } finally {
      await session.close()
    }
  } catch (error) {
    console.error("Update node error:", error)
    return Response.json({ success: false, error: "Failed to update node" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    const session = getSession()
    try {
      await session.run(
        `
        MATCH (n:GraphNode {id: $id})
        DETACH DELETE n
        `,
        { id }
      )

      return Response.json({ success: true })
    } finally {
      await session.close()
    }
  } catch (error) {
    console.error("Delete node error:", error)
    return Response.json({ success: false, error: "Failed to delete node" }, { status: 500 })
  }
}
