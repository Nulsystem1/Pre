import { query } from "@/lib/supabase"

/**
 * PATCH /api/review-queue/[id]
 * Approve or override a review item
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    const body = await req.json()
    const { reviewer_action, reviewer_notes, reviewed_by } = body
    
    if (!reviewer_action || !["approve", "override", "escalate"].includes(reviewer_action)) {
      return Response.json(
        { success: false, error: "Invalid reviewer_action. Must be: approve, override, or escalate" },
        { status: 400 }
      )
    }
    
    // Determine new status based on action
    let newStatus: "approved" | "overridden" | "escalated"
    if (reviewer_action === "approve") {
      newStatus = "approved"
    } else if (reviewer_action === "override") {
      newStatus = "overridden"
    } else {
      newStatus = "escalated"
    }
    
    // Update review item
    const updateSql = `
      UPDATE review_items 
      SET status = $1, reviewer_action = $2, reviewer_notes = $3, 
          reviewed_by = $4, reviewed_at = NOW()
      WHERE id = $5
      RETURNING *
    `
    
    const { data, error } = await query(updateSql, [
      newStatus,
      reviewer_action,
      reviewer_notes || null,
      reviewed_by || "system",
      id,
    ])
    
    if (error) throw error
    
    // Create audit event
    await query(
      `INSERT INTO audit_events (event_type, description, actor, review_item_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        "REVIEW_COMPLETED",
        `Review item ${reviewer_action}d by ${reviewed_by || "system"}`,
        reviewed_by || "system",
        id,
        JSON.stringify({ action: reviewer_action, notes: reviewer_notes }),
      ]
    )
    
    return Response.json({ success: true, data: data?.[0] })
  } catch (error) {
    console.error("Error updating review item:", error)
    return Response.json(
      { success: false, error: "Failed to update review item" },
      { status: 500 }
    )
  }
}

