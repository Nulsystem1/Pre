import { NextRequest, NextResponse } from "next/server"
import { createAuthToken, sendEmail } from "@/lib/auth"
import { query } from "@/lib/supabase"
import { enforceRateLimit, getClientIp, logSecurityEvent } from "@/lib/security"

export async function POST(request: NextRequest) {
  const genericResponse = NextResponse.json({
    message: "If the account exists, a verification email has been sent.",
  })

  try {
    const clientIp = getClientIp(request)
    const ipLimit = await enforceRateLimit(`resend-verification:ip:${clientIp}`, 10, 15 * 60 * 1000)
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      )
    }

    const { email } = await request.json()
    if (!email) return genericResponse

    const emailLimit = await enforceRateLimit(`resend-verification:email:${email}`, 3, 15 * 60 * 1000)
    if (!emailLimit.allowed) return genericResponse

    const { data: users } = await query(
      `SELECT id, email, email_verified FROM users WHERE email = $1 LIMIT 1`,
      [email]
    )
    if (!users || users.length === 0 || users[0].email_verified) return genericResponse

    const token = await createAuthToken(users[0].id, users[0].email, "VERIFY_EMAIL")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`

    await sendEmail({
      to: users[0].email,
      subject: "Verify your NUL account",
      html: `
        <p>Please verify your email to continue using your NUL account.</p>
        <p><a href="${verificationUrl}">Verify email</a></p>
      `,
    })

    await logSecurityEvent({
      eventType: "auth_verification_email_resent",
      description: "Verification email resent",
      actor: users[0].email,
      metadata: { userId: users[0].id },
    })

    return genericResponse
  } catch {
    return genericResponse
  }
}
