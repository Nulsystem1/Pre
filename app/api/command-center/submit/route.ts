import { query } from "@/lib/supabase"

// POST - Submit new event for processing
export async function POST(req: Request) {
  try {
    const { event_type, event_data, priority = "medium", policy_pack_id, source = "manual" } = await req.json()

    if (!event_type || !event_data) {
      return Response.json({ success: false, error: "Missing event_type or event_data" }, { status: 400 })
    }

    const sql = `
      INSERT INTO pending_decisions (
        event_type, event_data, priority, policy_pack_id, source, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, created_at
    `

    const { data, error } = await query(sql, [
      event_type,
      JSON.stringify(event_data),
      priority,
      policy_pack_id || null,
      source,
    ])

    if (error) throw error

    // Get queue position
    const { data: queueData } = await query(
      "SELECT COUNT(*) as position FROM pending_decisions WHERE status = 'pending' AND created_at < $1",
      [data?.[0]?.created_at]
    )

    return Response.json({
      success: true,
      data: {
        pending_decision_id: data?.[0]?.id,
        status: "queued",
        position_in_queue: (queueData?.[0]?.position || 0) + 1,
      },
    })
  } catch (error) {
    console.error("Submit event error:", error)
    return Response.json({ success: false, error: "Failed to submit event" }, { status: 500 })
  }
}

