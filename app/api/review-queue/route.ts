import { query } from "@/lib/supabase"

/**
 * GET /api/review-queue
 * List review items with optional filtering
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    let sql = `
      SELECT 
        ri.*,
        d.decision as decision_outcome,
        d.risk_score,
        d.ai_explanation,
        d.confidence as decision_confidence,
        e.event_type,
        e.payload as event_data
      FROM review_items ri
      LEFT JOIN decisions d ON ri.decision_id = d.id
      LEFT JOIN events e ON d.event_id = e.id
    `
    
    const params: unknown[] = []
    
    if (status) {
      sql += ` WHERE ri.status = $1`
      params.push(status)
    }
    
    sql += ` ORDER BY ri.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    
    const { data, error } = await query(sql, params)
    if (error) throw error
    
    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Error fetching review queue:", error)
    return Response.json({ success: false, error: "Failed to fetch review queue" }, { status: 500 })
  }
}

