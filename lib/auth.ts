// lib/auth.ts - Core authentication utilities for MVP
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { query } from "./supabase"
import { Resend } from "resend"
import { getRedisClient } from "./redis"

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_ACCESS_EXPIRES_IN =
  (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as jwt.SignOptions["expiresIn"]
const JWT_REFRESH_EXPIRES_IN =
  (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"]
const SESSION_TTL_SECONDS = Number(process.env.AUTH_SESSION_TTL_SECONDS || 24 * 60 * 60)
const REFRESH_TTL_SECONDS = Number(process.env.AUTH_REFRESH_TTL_SECONDS || 7 * 24 * 60 * 60)

export interface JWTPayload {
  userId: string
  organizationId?: string
  role?: string
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
}

export interface Organization {
  id: string
  name: string
  slug: string
  subscriptionStatus: string
  subscriptionPlan: string
}

// Password utilities (rounds: env BCRYPT_ROUNDS, default 12; use 10 in dev for speed)
export async function hashPassword(password: string): Promise<string> {
  const parsed = Number(process.env.BCRYPT_ROUNDS)
  const rounds =
    Number.isFinite(parsed) && parsed >= 4 && parsed <= 14 ? Math.floor(parsed) : 12
  return bcrypt.hash(password, rounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT utilities
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(
    {
      ...payload,
      tokenType: "refresh",
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  )
}

export function verifyRefreshToken(token: string): JWTPayload {
  const payload = jwt.verify(token, JWT_SECRET) as JWTPayload & { tokenType?: string }
  if (payload.tokenType !== "refresh") {
    throw new Error("Invalid refresh token")
  }
  return {
    userId: payload.userId,
    organizationId: payload.organizationId,
    role: payload.role,
  }
}

function sessionTokenKey(token: string): string {
  return `auth:session:token:${token}`
}

function userSessionSetKey(userId: string): string {
  return `auth:user-sessions:${userId}`
}

function refreshTokenKey(token: string): string {
  return `auth:refresh:token:${token}`
}

function userRefreshSetKey(userId: string): string {
  return `auth:user-refresh:${userId}`
}

export async function registerSessionToken(token: string, payload: JWTPayload) {
  const redis = await getRedisClient()
  if (!redis) return

  const tokenKey = sessionTokenKey(token)
  const userKey = userSessionSetKey(payload.userId)

  await redis.set(
    tokenKey,
    JSON.stringify({
      userId: payload.userId,
      organizationId: payload.organizationId || null,
      role: payload.role || null,
    }),
    { EX: SESSION_TTL_SECONDS }
  )
  await redis.sAdd(userKey, token)
  await redis.expire(userKey, SESSION_TTL_SECONDS)
}

export async function isSessionTokenActive(token: string): Promise<boolean> {
  const redis = await getRedisClient()
  if (!redis) return true
  const exists = await redis.exists(sessionTokenKey(token))
  return exists === 1
}

export async function registerRefreshToken(token: string, payload: JWTPayload) {
  const redis = await getRedisClient()
  if (!redis) return

  const tokenKey = refreshTokenKey(token)
  const userKey = userRefreshSetKey(payload.userId)

  await redis.set(
    tokenKey,
    JSON.stringify({
      userId: payload.userId,
      organizationId: payload.organizationId || null,
      role: payload.role || null,
    }),
    { EX: REFRESH_TTL_SECONDS }
  )
  await redis.sAdd(userKey, token)
  await redis.expire(userKey, REFRESH_TTL_SECONDS)
}

export async function consumeRefreshToken(token: string, userId?: string): Promise<boolean> {
  const redis = await getRedisClient()
  if (!redis) return true

  const tokenKey = refreshTokenKey(token)
  const exists = await redis.exists(tokenKey)
  if (!exists) return false

  await redis.del(tokenKey)
  if (userId) {
    await redis.sRem(userRefreshSetKey(userId), token)
  }
  return true
}

export async function invalidateSessionToken(token: string, userId?: string) {
  await query(`DELETE FROM sessions WHERE session_token = $1`, [token])

  const redis = await getRedisClient()
  if (!redis) return

  await redis.del(sessionTokenKey(token))
  if (userId) {
    await redis.sRem(userSessionSetKey(userId), token)
  }
}

export type AuthTokenType = "VERIFY_EMAIL" | "RESET_PASSWORD"

function tokenTtlMinutes(type: AuthTokenType): number {
  const key =
    type === "VERIFY_EMAIL"
      ? process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES
      : process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES
  const parsed = Number(key)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60
}

export function generateRawAuthToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function hashAuthToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}

export async function createAuthToken(
  userId: string,
  email: string,
  type: AuthTokenType
): Promise<string> {
  const rawToken = generateRawAuthToken()
  const tokenHash = hashAuthToken(rawToken)
  const expiresAt = new Date(Date.now() + tokenTtlMinutes(type) * 60 * 1000)

  await query(
    `INSERT INTO auth_tokens (user_id, email, token_hash, type, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, email, tokenHash, type, expiresAt]
  )

  return rawToken
}

export async function consumeAuthToken(rawToken: string, type: AuthTokenType) {
  const tokenHash = hashAuthToken(rawToken)
  const { data } = await query(
    `UPDATE auth_tokens
     SET used_at = NOW()
     WHERE token_hash = $1
       AND type = $2
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING id, user_id, email, type`,
    [tokenHash, type]
  )

  return data?.[0] || null
}

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const resendClient = resendApiKey ? new Resend(resendApiKey) : null

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}) {
  if (!resendClient) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const from = process.env.RESEND_FROM_EMAIL || "ellen@nulsystems.us"
  await resendClient.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

// User utilities
export async function getUserWithOrganization(userId: string) {
  const { data } = await query(`
    SELECT * FROM user_organization_view WHERE id = $1
  `, [userId])

  if (!data || data.length === 0) return null

  const user = data[0]
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      emailVerified: user.email_verified
    },
    organization: user.organization_id ? {
      id: user.organization_id,
      name: user.organization_name,
      slug: user.organization_slug,
      subscriptionStatus: user.subscription_status,
      subscriptionPlan: user.subscription_plan
    } : null,
    role: user.role
  }
}

// Organization utilities
export async function createOrganization(name: string, userId: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  // Create organization
  const { data: org } = await query(`
    INSERT INTO organizations (name, slug)
    VALUES ($1, $2)
    RETURNING id, name, slug, subscription_status, subscription_plan
  `, [name, slug])

  if (!org || org.length === 0) {
    throw new Error("Failed to create organization")
  }

  // Add user as admin
  await query(`
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES ($1, $2, 'admin')
  `, [org[0].id, userId])

  return org[0]
}

// Session utilities
export async function createSession(userId: string, organizationId?: string) {
  const sessionToken = generateToken({
    userId,
    organizationId,
    role: 'user' // Will be updated when we get user role
  })

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const { data } = await query(`
    INSERT INTO sessions (user_id, organization_id, session_token, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id, session_token, expires_at
  `, [userId, organizationId, sessionToken, expiresAt])

  if (!data || data.length === 0) {
    throw new Error("Failed to create session")
  }

  return data[0]
}

export async function getSessionByToken(token: string) {
  const { data } = await query(`
    SELECT s.*, u.email, om.role, o.name as org_name, o.slug as org_slug
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN organization_members om ON s.user_id = om.user_id AND s.organization_id = om.organization_id
    LEFT JOIN organizations o ON s.organization_id = o.id
    WHERE s.session_token = $1 AND s.expires_at > NOW()
  `, [token])

  return data?.[0] || null
}

export async function invalidateUserSessions(userId: string) {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId])

  const redis = await getRedisClient()
  if (!redis) return

  const userKey = userSessionSetKey(userId)
  const tokens = await redis.sMembers(userKey)
  if (tokens && tokens.length > 0) {
    const tokenKeys = tokens.map((token: string) => sessionTokenKey(token))
    await redis.del(tokenKeys)
  }
  await redis.del(userKey)

  const refreshUserKey = userRefreshSetKey(userId)
  const refreshTokens = await redis.sMembers(refreshUserKey)
  if (refreshTokens && refreshTokens.length > 0) {
    const refreshKeys = refreshTokens.map((token: string) => refreshTokenKey(token))
    await redis.del(refreshKeys)
  }
  await redis.del(refreshUserKey)
}