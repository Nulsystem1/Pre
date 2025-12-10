import { query } from "@/lib/supabase"

// GET - List pending decisions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || "pending"
    const priority = searchParams.get("priority")
    const limit = parseInt(searchParams.get("limit") || "50")

    let sql = `
      SELECT * FROM pending_decisions 
      WHERE status = $1
    `
    const params: unknown[] = [status]

    if (priority) {
      sql += ` AND priority = $${params.length + 1}`
      params.push(priority)
    }

    sql += ` ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END,
      created_at DESC 
      LIMIT $${params.length + 1}`
    params.push(limit)

    const { data: pending, error } = await query(sql, params)
    if (error) throw error

    // Get stats
    const { data: stats } = await query("SELECT * FROM command_center_stats", [])

    return Response.json({
      success: true,
      data: {
        pending_decisions: pending || [],
        stats: stats?.[0] || {},
      },
    })
  } catch (error) {
    console.error("Command center list error:", error)
    return Response.json({ success: false, error: "Failed to fetch pending decisions" }, { status: 500 })
  }
}

