import { NextRequest, NextResponse } from "next/server"
import { createAuthToken, sendEmail } from "@/lib/auth"
import { query } from "@/lib/supabase"
import { enforceRateLimit, getClientIp, logSecurityEvent } from "@/lib/security"

export async function POST(request: NextRequest) {
  const genericResponse = NextResponse.json({
    message: "If an account exists, a password reset email has been sent.",
  })

  try {
    const clientIp = getClientIp(request)
    const ipLimit = await enforceRateLimit(`forgot-password:ip:${clientIp}`, 10, 15 * 60 * 1000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      )
    }

    const { email } = await request.json()
    if (!email) return genericResponse

    const emailLimit = await enforceRateLimit(`forgot-password:email:${email}`, 3, 15 * 60 * 1000)
    if (!emailLimit.allowed) return genericResponse

    const { data: users } = await query(
      `SELECT id, email FROM users WHERE email = $1 LIMIT 1`,
      [email]
    )
    if (!users || users.length === 0) return genericResponse

    const token = await createAuthToken(users[0].id, users[0].email, "RESET_PASSWORD")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendEmail({
      to: users[0].email,
      subject: "Reset your NUL password",
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    })

    await logSecurityEvent({
      eventType: "auth_password_reset_requested",
      description: "Password reset email sent",
      actor: users[0].email,
      metadata: { userId: users[0].id },
    })

    return genericResponse
  } catch {
    return genericResponse
  }
}
