import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET

export interface JWTPayload {
  userId: string
  organizationId?: string
  role?: string
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  if (!JWT_SECRET) {
    throw new Error("JWT secret is not configured")
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (!payload.userId || typeof payload.userId !== "string") {
      throw new Error("Token payload is missing userId")
    }

    return {
      userId: payload.userId,
      organizationId:
        typeof payload.organizationId === "string" ? payload.organizationId : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    }
  } catch {
    throw new Error("Invalid or expired token")
  }
}
