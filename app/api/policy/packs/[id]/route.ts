import { getPolicyPackById, getControls, getPolicyChunks, updatePolicyPack, deleteReviewQueueCasesByPolicyPack, deleteCommandCenterResultsByPolicyPack, deletePolicyPack } from "@/lib/supabase"
import { getGraph, deleteGraphByPolicyPack } from "@/lib/neo4j"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const pack = await getPolicyPackById(id)
    if (!pack) {
      return Response.json({ success: false, error: "Pack not found" }, { status: 404 })
    }

    const [packControls, chunks, graph] = await Promise.all([
      getControls(id),
      getPolicyChunks(id),
      getGraph(id),
    ])

    return Response.json({
      success: true,
      data: {
        ...pack,
        controls: packControls,
        graph,
        chunks_count: chunks?.length ?? 0,
        graph_nodes_count: graph?.nodes?.length ?? 0,
        graph_edges_count: graph?.edges?.length ?? 0,
      },
    })
  } catch (error) {
    console.error("Get pack error:", error)
    return Response.json({ success: false, error: "Failed to get pack" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const updates = await req.json()
    
    const pack = await getPolicyPackById(id)
    if (!pack) {
      return Response.json({ success: false, error: "Pack not found" }, { status: 404 })
    }

    // If publishing, update version and timestamp
    if (updates.status === "active") {
      const currentVersion = Number.parseFloat(pack.version)
      updates.version = (currentVersion + 0.1).toFixed(1)
      updates.published_at = new Date().toISOString()
    }

    const updatedPack = await updatePolicyPack(id, updates)

    return Response.json({ success: true, data: updatedPack })
  } catch (error) {
    console.error("Update pack error:", error)
    return Response.json({ success: false, error: "Failed to update pack" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const pack = await getPolicyPackById(id)
    if (!pack) {
      return Response.json({ success: false, error: "Pack not found" }, { status: 404 })
    }

    // Cascade: delete command center results, review-queue cases, and graph for this pack, then the pack
    await deleteCommandCenterResultsByPolicyPack(id)
    await deleteReviewQueueCasesByPolicyPack(id)
    await deleteGraphByPolicyPack(id)
    await deletePolicyPack(id)

    return Response.json({ success: true, data: { id } })
  } catch (error) {
    console.error("Delete pack error:", error)
    return Response.json({ success: false, error: "Failed to delete pack" }, { status: 500 })
  }
}
