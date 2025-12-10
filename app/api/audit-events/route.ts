import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import type { AuditEvent } from "@/lib/types"

/**
 * GET /api/audit-events
 * List audit events with optional filtering
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const event_type = searchParams.get("event_type")
    const document_id = searchParams.get("document_id")
    const limit = parseInt(searchParams.get("limit") || "100")
    
    const supabase = getSupabase()
    
    let query = supabase
      .from("audit_events")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit)
    
    if (event_type) {
      query = query.eq("event_type", event_type)
    }
    
    if (document_id) {
      query = query.eq("document_id", document_id)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data as AuditEvent[] })
  } catch (error) {
    console.error("Error fetching audit events:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit events" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/audit-events
 * Create a new audit event
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event_type, description, actor, document_id, rule_id, review_item_id, decision_id, metadata } = body
    
    if (!event_type || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: event_type, description" },
        { status: 400 }
      )
    }
    
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from("audit_events")
      .insert({
        event_type,
        description,
        actor: actor || null,
        document_id: document_id || null,
        rule_id: rule_id || null,
        review_item_id: review_item_id || null,
        decision_id: decision_id || null,
        metadata: metadata || {},
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data as AuditEvent })
  } catch (error) {
    console.error("Error creating audit event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create audit event" },
      { status: 500 }
    )
  }
}

