import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import type { ExecutionTarget } from "@/lib/types"

/**
 * GET /api/execution-targets/[id]
 * Get a specific execution target
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from("execution_targets")
      .select("*")
      .eq("id", params.id)
      .single()
    
    if (error) throw error
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Execution target not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: data as ExecutionTarget })
  } catch (error) {
    console.error("Error fetching execution target:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch execution target" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/execution-targets/[id]
 * Update an execution target
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from("execution_targets")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data as ExecutionTarget })
  } catch (error) {
    console.error("Error updating execution target:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update execution target" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/execution-targets/[id]
 * Delete an execution target
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase()
    
    const { error } = await supabase
      .from("execution_targets")
      .delete()
      .eq("id", params.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting execution target:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete execution target" },
      { status: 500 }
    )
  }
}

