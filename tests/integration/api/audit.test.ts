/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"

const BASE_URL = process.env.TEST_BASE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3001"
const base = BASE_URL.startsWith("http") ? BASE_URL : `https://${BASE_URL}`

describe("GET /api/audit (integration)", () => {
  it("returns 200 and data.decisions array", async () => {
    const res = await fetch(`${base}/api/audit?limit=2`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data?.decisions)).toBe(true)
  })

  it("accepts outcome filter", async () => {
    const res = await fetch(`${base}/api/audit?outcome=APPROVED&limit=2`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    if (body.data?.decisions?.length > 0) {
      body.data.decisions.forEach((d: { outcome: string }) => expect(d.outcome).toBe("APPROVED"))
    }
  })
})
