import { createClient } from "redis"

let redisClient: any | null = null
let redisConnectPromise: Promise<any | null> | null = null
let reconnectAttempts = 0

function reconnectStrategy(retries: number): number | Error {
  reconnectAttempts = retries
  if (retries > 12) {
    return new Error("Redis reconnect retries exceeded")
  }
  // Exponential backoff capped at 5s.
  return Math.min(5000, 200 * 2 ** retries)
}

export async function getRedisClient(): Promise<any | null> {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (redisClient?.isReady) return redisClient
  if (redisConnectPromise) return redisConnectPromise

  redisConnectPromise = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy,
          connectTimeout: 2000,
          keepAlive: true,
        },
        pingInterval: 10000,
      })
      client.on("error", () => {})
      client.on("ready", () => {
        reconnectAttempts = 0
      })
      await client.connect()
      redisClient = client
      return client
    } catch {
      return null
    } finally {
      redisConnectPromise = null
    }
  })()

  return redisConnectPromise
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient()
  if (!redis) return null
  const raw = await redis.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number) {
  const redis = await getRedisClient()
  if (!redis) return
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds })
}
