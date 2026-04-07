import { NextRequest, NextResponse } from "next/server"
import {
  verifyPassword,
  generateToken,
  generateRefreshToken,
  registerSessionToken,
  registerRefreshToken,
} from "@/lib/auth"
import { query } from "@/lib/supabase"
import { enforceRateLimit, getClientIp } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = await enforceRateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get user with organization info
    const { data: users } = await query(`
      SELECT
        u.id, u.email, u.password_hash, u.first_name, u.last_name, u.email_verified,
        om.organization_id, om.role,
        o.name as org_name, o.slug as org_slug, o.subscription_status, o.subscription_plan
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id
      LEFT JOIN organizations o ON om.organization_id = o.id
      WHERE u.email = $1
    `, [email])

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    if (!user.email_verified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role
    })
    const refreshToken = generateRefreshToken({
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
    })
    await registerSessionToken(token, {
      userId: user.id,
      organizationId: user.organization_id || undefined,
      role: user.role || undefined,
    })
    await registerRefreshToken(refreshToken, {
      userId: user.id,
      organizationId: user.organization_id || undefined,
      role: user.role || undefined,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified
      },
      organization: user.organization_id ? {
        id: user.organization_id,
        name: user.org_name,
        slug: user.org_slug,
        subscriptionStatus: user.subscription_status,
        subscriptionPlan: user.subscription_plan
      } : null,
      role: user.role,
      token,
      refreshToken,
      accessTokenTtlSeconds: Number(process.env.AUTH_SESSION_TTL_SECONDS || 24 * 60 * 60)
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}