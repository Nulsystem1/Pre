import { policyPacks, controls } from "@/lib/store"
import type { PolicyPack } from "@/lib/types"

export async function GET() {
  // Return policy packs with control counts
  const packsWithCounts = policyPacks.map((pack) => ({
    ...pack,
    controls_count: controls.filter((c) => c.policy_pack_id === pack.id).length,
  }))

  return Response.json({ success: true, data: packsWithCounts })
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()

    if (!name) {
      return Response.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    const newPack: PolicyPack = {
      id: `pack-${Date.now()}`,
      name,
      version: "1.0",
      status: "draft",
      raw_content: null,
      description: description || null,
      created_at: new Date().toISOString(),
      published_at: null,
    }

    policyPacks.push(newPack)

    return Response.json({ success: true, data: newPack })
  } catch (error) {
    console.error("Create pack error:", error)
    return Response.json({ success: false, error: "Failed to create pack" }, { status: 500 })
  }
}
