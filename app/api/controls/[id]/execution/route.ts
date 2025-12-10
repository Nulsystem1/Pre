import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

/**
 * PATCH /api/controls/[id]/execution
 * Map a control to an execution target
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { execution_target_id, confidence_threshold } = body
    
    const supabase = getSupabase()
    
    const updateData: Record<string, unknown> = {}
    if (execution_target_id !== undefined) {
      updateData.execution_target_id = execution_target_id
    }
    if (confidence_threshold !== undefined) {
      updateData.confidence_threshold = confidence_threshold
    }
    
    const { data, error } = await supabase
      .from("controls")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating control execution mapping:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update control execution mapping" },
      { status: 500 }
    )
  }
}

