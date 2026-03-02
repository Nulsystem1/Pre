/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"

const BASE_URL = process.env.TEST_BASE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3001"
const base = BASE_URL.startsWith("http") ? BASE_URL : `https://${BASE_URL}`

describe("GET /api/policy/packs (integration)", () => {
  it("returns 200 and data array (or 503 if DB unavailable)", async () => {
    const res = await fetch(`${base}/api/policy/packs`)
    expect([200, 503]).toContain(res.status)
    const body = await res.json()
    if (res.status === 200) {
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
    }
  })
})
