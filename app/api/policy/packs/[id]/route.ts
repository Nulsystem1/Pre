import { policyPacks, controls, graphNodes, graphEdges } from "@/lib/store"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const pack = policyPacks.find((p) => p.id === id)
  if (!pack) {
    return Response.json({ success: false, error: "Pack not found" }, { status: 404 })
  }

  const packControls = controls.filter((c) => c.policy_pack_id === id)
  const packNodes = graphNodes.filter((n) => n.policy_pack_id === id)
  const packEdges = graphEdges.filter((e) => e.policy_pack_id === id)

  return Response.json({
    success: true,
    data: {
      ...pack,
      controls: packControls,
      graph: {
        nodes: packNodes,
        edges: packEdges,
      },
    },
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const updates = await req.json()
    const packIndex = policyPacks.findIndex((p) => p.id === id)

    if (packIndex === -1) {
      return Response.json({ success: false, error: "Pack not found" }, { status: 404 })
    }

    // Update pack fields
    if (updates.name) policyPacks[packIndex].name = updates.name
    if (updates.status) policyPacks[packIndex].status = updates.status
    if (updates.raw_content !== undefined) policyPacks[packIndex].raw_content = updates.raw_content

    // If publishing, update version and timestamp
    if (updates.status === "active") {
      const currentVersion = Number.parseFloat(policyPacks[packIndex].version)
      policyPacks[packIndex].version = (currentVersion + 0.1).toFixed(1)
      policyPacks[packIndex].published_at = new Date().toISOString()
    }

    return Response.json({ success: true, data: policyPacks[packIndex] })
  } catch (error) {
    console.error("Update pack error:", error)
    return Response.json({ success: false, error: "Failed to update pack" }, { status: 500 })
  }
}
