import { NextRequest, NextResponse } from "next/server"
import {
  consumeRefreshToken,
  generateRefreshToken,
  generateToken,
  registerRefreshToken,
  registerSessionToken,
  verifyRefreshToken,
} from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    const payload = verifyRefreshToken(refreshToken)
    const consumed = await consumeRefreshToken(refreshToken, payload.userId)
    if (!consumed) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    const nextAccessToken = generateToken(payload)
    const nextRefreshToken = generateRefreshToken(payload)
    await registerSessionToken(nextAccessToken, payload)
    await registerRefreshToken(nextRefreshToken, payload)

    return NextResponse.json({
      token: nextAccessToken,
      refreshToken: nextRefreshToken,
      accessTokenTtlSeconds: Number(process.env.AUTH_SESSION_TTL_SECONDS || 24 * 60 * 60),
    })
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
  }
}
