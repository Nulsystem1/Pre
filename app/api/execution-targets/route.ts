import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import type { ExecutionTarget } from "@/lib/types"

/**
 * GET /api/execution-targets
 * List all execution targets
 */
export async function GET() {
  try {
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from("execution_targets")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data as ExecutionTarget[] })
  } catch (error) {
    console.error("Error fetching execution targets:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch execution targets" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/execution-targets
 * Create a new execution target
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, description, integration_label, config, enabled } = body
    
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, type" },
        { status: 400 }
      )
    }
    
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from("execution_targets")
      .insert({
        name,
        type,
        description: description || null,
        integration_label: integration_label || null,
        config: config || {},
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data as ExecutionTarget })
  } catch (error) {
    console.error("Error creating execution target:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create execution target" },
      { status: 500 }
    )
  }
}

