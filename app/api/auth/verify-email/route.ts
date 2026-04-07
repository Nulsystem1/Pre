import { NextRequest, NextResponse } from "next/server"
import { consumeAuthToken } from "@/lib/auth"
import { query } from "@/lib/supabase"
import { logSecurityEvent } from "@/lib/security"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 })
    }

    const tokenRow = await consumeAuthToken(token, "VERIFY_EMAIL")
    if (!tokenRow) {
      await logSecurityEvent({
        eventType: "auth_verification_failed",
        description: "Verification token invalid, expired, or already used",
      })
      return NextResponse.json({ error: "Invalid verification request" }, { status: 400 })
    }

    const { data, error } = await query(
      `UPDATE users
       SET email_verified = true
       WHERE id = $1
       RETURNING id, email, email_verified`,
      [tokenRow.user_id]
    )

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: "Invalid verification request" }, { status: 400 })
    }

    await logSecurityEvent({
      eventType: "auth_verification_success",
      description: "User email verified successfully",
      actor: data[0].email,
      metadata: { userId: data[0].id },
    })

    return NextResponse.json({
      message: "Email verified successfully. You can now sign in.",
      user: data[0],
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
  }
}
