/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"

const BASE_URL = process.env.TEST_BASE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3001"
const base = BASE_URL.startsWith("http") ? BASE_URL : `https://${BASE_URL}`

describe("GET /api/health (integration)", () => {
  it("returns 200 and ok shape", async () => {
    const res = await fetch(`${base}/api/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toBeDefined()
    expect(typeof body.ok === "boolean" || body.status !== undefined).toBe(true)
  })
})
