import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

/**
 * PATCH /api/review-queue/[id]
 * Approve or override a review item
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { reviewer_action, reviewer_notes, reviewed_by } = body
    
    if (!reviewer_action || !["approve", "override", "escalate"].includes(reviewer_action)) {
      return NextResponse.json(
        { success: false, error: "Invalid reviewer_action. Must be: approve, override, or escalate" },
        { status: 400 }
      )
    }
    
    const supabase = getSupabase()
    
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
    const { data, error } = await supabase
      .from("review_items")
      .update({
        status: newStatus,
        reviewer_action,
        reviewer_notes: reviewer_notes || null,
        reviewed_by: reviewed_by || "system",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()
    
    if (error) throw error
    
    // Create audit event
    await supabase.from("audit_events").insert({
      event_type: "REVIEW_COMPLETED",
      description: `Review item ${reviewer_action}d by ${reviewed_by || "system"}`,
      actor: reviewed_by || "system",
      review_item_id: params.id,
      metadata: {
        action: reviewer_action,
        notes: reviewer_notes,
      },
    })
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating review item:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update review item" },
      { status: 500 }
    )
  }
}

