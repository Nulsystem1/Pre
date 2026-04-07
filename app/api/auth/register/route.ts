import { NextRequest, NextResponse, after } from "next/server"
import { createAuthToken, createOrganization, hashPassword, sendEmail } from "@/lib/auth"
import { query } from "@/lib/supabase"
import { enforceRateLimit, getClientIp, logSecurityEvent } from "@/lib/security"
import { getRegistrationFieldErrors } from "@/lib/register-validation"
import { registrationQueryErrorResponse } from "@/lib/registration-db-error"

function toErrorDetail(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  return "Unknown error"
}

function internalError(message: string, error?: unknown) {
  const isDev = process.env.NODE_ENV !== "production"
  if (isDev && error) {
    return NextResponse.json({ error: message, detail: toErrorDetail(error) }, { status: 500 })
  }
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = await enforceRateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    const body = await request.json()
    const emailRaw = body?.email
    const passwordRaw = body?.password
    const firstNameRaw = body?.firstName
    const lastNameRaw = body?.lastName
    const organizationNameRaw = body?.organizationName

    const fieldErrors = getRegistrationFieldErrors({
      email: emailRaw,
      password: passwordRaw,
      firstName: firstNameRaw,
      lastName: lastNameRaw,
    })
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ errors: fieldErrors }, { status: 400 })
    }

    const email = String(emailRaw).trim()
    const password = String(passwordRaw)
    const firstName =
      firstNameRaw != null && String(firstNameRaw).trim() !== ""
        ? String(firstNameRaw).trim()
        : null
    const lastName =
      lastNameRaw != null && String(lastNameRaw).trim() !== ""
        ? String(lastNameRaw).trim()
        : null
    const organizationName =
      organizationNameRaw != null && String(organizationNameRaw).trim() !== ""
        ? String(organizationNameRaw).trim()
        : null

    const { data: existingUsers, error: existingUsersError } = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    )
    if (existingUsersError) {
      console.error("Registration existing-user query error:", existingUsersError)
      return registrationQueryErrorResponse(existingUsersError)!
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { errors: { email: "An account with this email already exists." } },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const { data: user, error: userInsertError } = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, email_verified`,
      [email, passwordHash, firstName, lastName]
    )
    if (userInsertError) {
      console.error("Registration user insert error:", userInsertError)
      return registrationQueryErrorResponse(userInsertError)!
    }

    if (!user || user.length === 0) {
      return internalError("Unable to create account.")
    }

    if (organizationName) {
      try {
        await createOrganization(organizationName, user[0].id)
      } catch (orgErr) {
        console.error("Registration organization error:", orgErr)
        return NextResponse.json(
          {
            errors: {
              organizationName:
                "Could not create that organization. Try a different name or leave the field blank.",
            },
          },
          { status: 400 }
        )
      }
    }

    const verificationToken = await createAuthToken(user[0].id, user[0].email, "VERIFY_EMAIL")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`

    const userEmail = user[0].email
    const userId = user[0].id

    const sendVerificationEmailJob = async () => {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Verify your NUL account",
          html: `
          <p>Welcome to NUL.</p>
          <p>Please verify your email address to activate your account.</p>
          <p><a href="${verificationUrl}">Verify email</a></p>
          <p>If you did not create this account, you can ignore this email.</p>
        `,
        })
        await logSecurityEvent({
          eventType: "auth_verification_email_sent",
          description: "Verification email sent after registration",
          actor: userEmail,
          metadata: { userId },
        })
      } catch (emailErr) {
        console.error(
          "Registration verification email failed:",
          emailErr instanceof Error ? emailErr.message : emailErr,
          "| Check RESEND_API_KEY, RESEND_FROM_EMAIL (verified domain in Resend), and server logs."
        )
        try {
          await logSecurityEvent({
            eventType: "auth_verification_email_send_failed",
            description: "Failed to send verification email after registration",
            actor: userEmail,
            metadata: {
              userId,
              reason: emailErr instanceof Error ? emailErr.message : String(emailErr),
            },
          })
        } catch {
          /* ignore */
        }
      }
    }

    const isDev = process.env.NODE_ENV === "development"
    if (isDev) {
      await sendVerificationEmailJob()
    } else {
      try {
        after(sendVerificationEmailJob)
      } catch {
        void sendVerificationEmailJob()
      }
    }

    const includeVerificationLink =
      isDev || process.env.EMAIL_VERIFICATION_LOG_LINK === "true"

    return NextResponse.json({
      verificationRequired: true,
      message: "Registration successful. Please verify your email before signing in.",
      ...(includeVerificationLink ? { verificationUrl } : {}),
    })
  } catch (error) {
    console.error("Registration error:", error)
    return internalError("Registration failed", error)
  }
}
