import { NextRequest, NextResponse } from "next/server"
import { extractTokenFromHeader, invalidateSessionToken, verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ message: "Logged out" })
    }

    let userId: string | undefined
    try {
      const payload = verifyToken(token)
      userId = payload.userId
    } catch {
      userId = undefined
    }

    await invalidateSessionToken(token, userId)
    return NextResponse.json({ message: "Logged out" })
  } catch {
    return NextResponse.json({ message: "Logged out" })
  }
}
