import { controls } from "@/lib/store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const policyPackId = searchParams.get("policyPackId")
  const enabledOnly = searchParams.get("enabledOnly") === "true"

  let result = policyPackId ? controls.filter((c) => c.policy_pack_id === policyPackId) : controls

  if (enabledOnly) {
    result = result.filter((c) => c.enabled)
  }

  return Response.json({ success: true, data: result })
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json()
    const controlIndex = controls.findIndex((c) => c.id === id)

    if (controlIndex === -1) {
      return Response.json({ success: false, error: "Control not found" }, { status: 404 })
    }

    // Update allowed fields
    if (typeof updates.enabled === "boolean") {
      controls[controlIndex].enabled = updates.enabled
    }
    if (updates.name) {
      controls[controlIndex].name = updates.name
    }
    if (updates.risk_weight !== undefined) {
      controls[controlIndex].risk_weight = updates.risk_weight
    }

    return Response.json({ success: true, data: controls[controlIndex] })
  } catch (error) {
    console.error("Update control error:", error)
    return Response.json({ success: false, error: "Failed to update control" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const controlIndex = controls.findIndex((c) => c.id === id)

    if (controlIndex === -1) {
      return Response.json({ success: false, error: "Control not found" }, { status: 404 })
    }

    controls.splice(controlIndex, 1)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete control error:", error)
    return Response.json({ success: false, error: "Failed to delete control" }, { status: 500 })
  }
}
