/// <reference path="../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"

const BASE_URL = process.env.TEST_BASE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3001"
const base = BASE_URL.startsWith("http") ? BASE_URL : `https://${BASE_URL}`

const CORE_PATHS = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/command-center", name: "Command Center" },
  { path: "/audit-explorer", name: "Audit Explorer" },
  { path: "/review-queue", name: "Review Queue" },
  { path: "/policy-studio", name: "Policy Studio" }
]

describe("Smoke: core UI paths", () => {
  for (const { path: p, name } of CORE_PATHS) {
    it(`${name} (${p}) returns 200 and renderable HTML`, async () => {
      const res = await fetch(`${base}${p}`, { redirect: "manual" })
      expect([200, 307, 308]).toContain(res.status)
      if (res.status === 200) {
        const html = await res.text()
        expect(html.length).toBeGreaterThan(0)
        expect(html.toLowerCase()).toMatch(/<!doctype html|<html|<\/html>/)
      }
    })
  }
})
