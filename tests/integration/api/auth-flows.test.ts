/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const authMocks = vi.hoisted(() => ({
  createAuthToken: vi.fn(),
  createOrganization: vi.fn(),
  hashPassword: vi.fn(),
  sendEmail: vi.fn(),
  consumeAuthToken: vi.fn(),
  verifyPassword: vi.fn(),
  generateToken: vi.fn(),
  registerSessionToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  registerRefreshToken: vi.fn(),
  extractTokenFromHeader: vi.fn(),
  invalidateSessionToken: vi.fn(),
  verifyToken: vi.fn(),
  invalidateUserSessions: vi.fn(),
}))

const supabaseMocks = vi.hoisted(() => ({
  query: vi.fn(),
}))

const securityMocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  logSecurityEvent: vi.fn(),
}))

vi.mock("@/lib/auth", () => authMocks)
vi.mock("@/lib/supabase", () => supabaseMocks)
vi.mock("@/lib/security", () => securityMocks)

import { POST as registerPost } from "@/app/api/auth/register/route"
import { GET as verifyEmailGet } from "@/app/api/auth/verify-email/route"
import { POST as loginPost } from "@/app/api/auth/login/route"
import { POST as logoutPost } from "@/app/api/auth/logout/route"
import { POST as resetPost } from "@/app/api/auth/reset-password/route"

describe("Auth API flows (integration-style)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    securityMocks.enforceRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
    securityMocks.getClientIp.mockReturnValue("127.0.0.1")
    authMocks.hashPassword.mockResolvedValue("hashed-password")
  })

  it("register returns verificationRequired", async () => {
    supabaseMocks.query
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [{ id: "u1", email: "user@example.com", first_name: "A", last_name: "B", email_verified: false }],
        error: null,
      })
    authMocks.createAuthToken.mockResolvedValue("verify-token")

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        organizationName: "",
      }),
      headers: { "content-type": "application/json" },
    })

    const res = await registerPost(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.verificationRequired).toBe(true)
  })

  it("register returns field errors for invalid email", async () => {
    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "not-an-email",
        password: "Password123!",
        firstName: "A",
        lastName: "B",
        organizationName: "",
      }),
      headers: { "content-type": "application/json" },
    })

    const res = await registerPost(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.errors?.email).toBeTruthy()
  })

  it("register returns field errors for weak password", async () => {
    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "short1!",
        firstName: "A",
        lastName: "B",
        organizationName: "",
      }),
      headers: { "content-type": "application/json" },
    })

    const res = await registerPost(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.errors?.password).toBeTruthy()
  })

  it("register returns field errors for non-letter name", async () => {
    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "Password123!",
        firstName: "J0hn",
        lastName: "B",
        organizationName: "",
      }),
      headers: { "content-type": "application/json" },
    })

    const res = await registerPost(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.errors?.firstName).toBeTruthy()
  })

  it("verify-email consumes token and verifies user", async () => {
    authMocks.consumeAuthToken.mockResolvedValue({ user_id: "u1" })
    supabaseMocks.query.mockResolvedValue({
      data: [{ id: "u1", email: "user@example.com", email_verified: true }],
      error: null,
    })

    const req = new NextRequest("http://localhost/api/auth/verify-email?token=verify-token")
    const res = await verifyEmailGet(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.user.email_verified).toBe(true)
  })

  it("login returns access and refresh tokens", async () => {
    supabaseMocks.query.mockResolvedValue({
      data: [
        {
          id: "u1",
          email: "user@example.com",
          password_hash: "hashed",
          first_name: "A",
          last_name: "B",
          email_verified: true,
          organization_id: null,
          role: "employee",
          org_name: null,
          org_slug: null,
          subscription_status: null,
          subscription_plan: null,
        },
      ],
      error: null,
    })
    authMocks.verifyPassword.mockResolvedValue(true)
    authMocks.generateToken.mockReturnValue("access-token")
    authMocks.generateRefreshToken.mockReturnValue("refresh-token")

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "Password123!",
      }),
      headers: { "content-type": "application/json" },
    })

    const res = await loginPost(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.token).toBe("access-token")
    expect(body.refreshToken).toBe("refresh-token")
  })

  it("logout revokes session token", async () => {
    authMocks.extractTokenFromHeader.mockReturnValue("access-token")
    authMocks.verifyToken.mockReturnValue({ userId: "u1" })

    const req = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { authorization: "Bearer access-token" },
    })

    const res = await logoutPost(req)
    expect(res.status).toBe(200)
    expect(authMocks.invalidateSessionToken).toHaveBeenCalledWith("access-token", "u1")
  })

  it("reset-password validates token and updates password", async () => {
    authMocks.consumeAuthToken.mockResolvedValue({ user_id: "u1", email: "user@example.com" })
    authMocks.hashPassword.mockResolvedValue("new-hash")
    supabaseMocks.query.mockResolvedValue({ data: [], error: null })

    const req = new NextRequest("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: "reset-token", newPassword: "NewPassword123!" }),
      headers: { "content-type": "application/json" },
    })

    const res = await resetPost(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.message).toContain("Password reset successful")
    expect(authMocks.invalidateUserSessions).toHaveBeenCalledWith("u1")
  })
})
