import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader } from "./lib/auth-edge"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/api/auth"]
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = extractTokenFromHeader(request.headers.get("authorization"))
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  try {
    const payload = await verifyToken(token)

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.userId)
    if (payload.organizationId) {
      requestHeaders.set("x-organization-id", payload.organizationId)
    }
    if (payload.role) {
      requestHeaders.set("x-user-role", payload.role)
    }

    return NextResponse.next({
      request: { headers: requestHeaders }
    })
  } catch (error) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}