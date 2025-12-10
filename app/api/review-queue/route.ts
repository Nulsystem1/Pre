import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import type { ReviewItem } from "@/lib/types"

/**
 * GET /api/review-queue
 * List review items with optional filtering
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    const supabase = getSupabase()
    
    let query = supabase
      .from("review_items")
      .select("*, events(*), controls(*), decisions(*)")
      .order("created_at", { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq("status", status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data as ReviewItem[] })
  } catch (error) {
    console.error("Error fetching review queue:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch review queue" },
      { status: 500 }
    )
  }
}

