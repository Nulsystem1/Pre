import { getPolicyPacks, createPolicyPack, supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Get policy packs from Supabase
    const packs = await getPolicyPacks()

    // Get control counts for each pack
    const packsWithCounts = await Promise.all(
      packs.map(async (pack) => {
        const { count } = await supabase
          .from("controls")
          .select("*", { count: "exact", head: true })
          .eq("policy_pack_id", pack.id)

        return {
          ...pack,
          controls_count: count || 0,
        }
      })
    )

    return Response.json({ success: true, data: packsWithCounts })
  } catch (error) {
    console.error("Get packs error:", error)
    return Response.json({ success: false, error: "Failed to get policy packs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()

    if (!name) {
      return Response.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    const newPack = await createPolicyPack({
      name,
      version: "1.0",
      status: "draft",
      description: description || undefined,
    })

    return Response.json({ success: true, data: newPack })
  } catch (error) {
    console.error("Create pack error:", error)
    return Response.json({ success: false, error: "Failed to create pack" }, { status: 500 })
  }
}
