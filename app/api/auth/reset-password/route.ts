import { NextRequest, NextResponse } from "next/server"
import { consumeAuthToken, hashPassword, invalidateUserSessions } from "@/lib/auth"
import { query } from "@/lib/supabase"
import { logSecurityEvent } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()
    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Token and a new password of at least 8 characters are required." },
        { status: 400 }
      )
    }

    const tokenRow = await consumeAuthToken(token, "RESET_PASSWORD")
    if (!tokenRow) {
      await logSecurityEvent({
        eventType: "auth_password_reset_failed",
        description: "Password reset token invalid, expired, or already used",
      })
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)
    const { error } = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [newHash, tokenRow.user_id]
    )
    if (error) {
      return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
    }

    await invalidateUserSessions(tokenRow.user_id)

    await logSecurityEvent({
      eventType: "auth_password_reset_success",
      description: "Password reset completed successfully",
      actor: tokenRow.email,
      metadata: { userId: tokenRow.user_id },
    })

    return NextResponse.json({ message: "Password reset successful. You can now sign in." })
  } catch {
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
  }
}
