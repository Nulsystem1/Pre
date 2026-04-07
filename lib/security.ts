import { NextRequest } from "next/server"
import { query } from "./supabase"
import { getRedisClient } from "./redis"

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return "unknown"
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const redis = await getRedisClient()
  if (redis) {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.pExpire(key, windowMs)
      return { allowed: true, retryAfterSeconds: 0 }
    }

    if (count > limit) {
      const ttlMs = await redis.pTTL(key)
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(Math.max(ttlMs, 1000) / 1000)),
      }
    }
    return { allowed: true, retryAfterSeconds: 0 }
  }

  const now = Date.now()
  const current = store.get(key)

  if (!current || now > current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  store.set(key, current)
  return { allowed: true, retryAfterSeconds: 0 }
}

export async function logSecurityEvent(params: {
  eventType: string
  description: string
  actor?: string
  metadata?: Record<string, unknown>
}) {
  await query(
    `INSERT INTO audit_events (event_type, description, actor, metadata)
     VALUES ($1, $2, $3, $4)`,
    [
      params.eventType,
      params.description,
      params.actor || null,
      params.metadata || {},
    ]
  )
}
