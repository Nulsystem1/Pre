import { getControls, getEnabledControls, supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const policyPackId = searchParams.get("policyPackId")
    const enabledOnly = searchParams.get("enabledOnly") === "true"

    if (enabledOnly) {
      const result = await getEnabledControls(policyPackId || undefined)
      return Response.json({ success: true, data: result })
    }

    const result = await getControls(policyPackId || undefined)
    return Response.json({ success: true, data: result })
  } catch (error) {
    console.error("Get controls error:", error)
    return Response.json({ success: false, error: "Failed to get controls" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json()

    const { data, error } = await supabase
      .from("controls")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data })
  } catch (error) {
    console.error("Update control error:", error)
    return Response.json({ success: false, error: "Failed to update control" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    const { error } = await supabase
      .from("controls")
      .delete()
      .eq("id", id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete control error:", error)
    return Response.json({ success: false, error: "Failed to delete control" }, { status: 500 })
  }
}
