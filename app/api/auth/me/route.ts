import { NextRequest, NextResponse } from "next/server"
import { verifyToken, getUserWithOrganization, isSessionTokenActive } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    const isActive = await isSessionTokenActive(token)
    if (!isActive) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    const userData = await getUserWithOrganization(payload.userId)
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}