import { getPolicyPackById, getControls, updatePolicyPack } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const pack = await getPolicyPackById(id)
    if (!pack) {
      return Response.json({ success: false, error: "Pack not found" }, { status: 404 })
    }

    const packControls = await getControls(id)
    const graph = await getGraph(id)

    return Response.json({
      success: true,
      data: {
        ...pack,
        controls: packControls,
        graph,
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
