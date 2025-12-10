import { query } from "@/lib/supabase"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const outcome = searchParams.get("outcome")

    let sql = `
      SELECT 
        d.id,
        d.decision as outcome,
        d.risk_score,
        d.ai_explanation as reasoning,
        d.confidence,
        d.agent_attempts,
        d.requires_human_review,
        d.matched_conditions,
        d.created_at,
        e.event_type,
        e.payload as event_data,
        pd.priority,
        pd.agent_queries_used
      FROM decisions d
      LEFT JOIN events e ON d.event_id = e.id
      LEFT JOIN pending_decisions pd ON d.pending_decision_id = pd.id
    `

    const params: unknown[] = []

    if (outcome) {
      sql += ` WHERE d.decision = $1`
      params.push(outcome)
    }

    sql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const { data, error } = await query(sql, params)
    if (error) throw error

    return Response.json({
      success: true,
      data: {
        decisions: data || [],
        total: data?.length || 0,
      },
    })
  } catch (error) {
    console.error("Audit fetch error:", error)
    return Response.json({ success: false, error: "Failed to fetch audit data" }, { status: 500 })
  }
}

