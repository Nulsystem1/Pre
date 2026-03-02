import { NextResponse } from "next/server"

/**
 * GET /api/health
 * Simple health check for Fly.io / load balancers.
 * Returns 200 when the app is up. Optionally extend to check DB/Neo4j.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 }
  )
}
