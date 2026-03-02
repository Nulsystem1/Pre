/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"

// --- Config & constants ---

const BASE_URL =
  process.env.TEST_BASE_URL ?? process.env.VERCEL_URL ?? "http://localhost:3001"
const base = BASE_URL.startsWith("http") ? BASE_URL : `https://${BASE_URL}`

const EVALUATE_AGENTIC_PATH = "/api/decisions/evaluate-agentic"
const POLICY_PACKS_PATH = "/api/policy/packs"
const JSON_HEADERS = { "Content-Type": "application/json" } as const

const VALID_OUTCOMES = ["APPROVED", "REVIEW", "BLOCKED"] as const
const ALLOWED_STATUSES = [200, 400, 500, 503] as const
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// --- Types ---

type EvaluateAgenticSuccess = {
  success: true
  data: { outcome: string; confidence: number; risk_score: number }
}

type EvaluateAgenticError = { success: false; error?: string }

// --- Helpers ---

async function postEvaluateAgentic(payload: Record<string, unknown>) {
  return fetch(`${base}${EVALUATE_AGENTIC_PATH}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  })
}

async function parseErrorMessage(res: Response): Promise<string> {
  const raw = (await res.json()) as unknown
  if (typeof raw === "object" && raw !== null && "error" in raw) {
    const err = (raw as { error?: unknown }).error
    return typeof err === "string" ? err : ""
  }
  return ""
}

async function createTestPolicyPack(): Promise<string> {
  const res = await fetch(`${base}${POLICY_PACKS_PATH}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: `Integration test policy pack ${Date.now()}-${Math.random().toString(16).slice(2)}`,
      version: `test-${Date.now()}`,
      description: "Integration test policy pack",
    }),
  })
  const body = (await res.json()) as { data?: { id?: string } }
  const id = body.data?.id
  if (!id || typeof id !== "string") {
    throw new Error(`Failed to create policy pack: ${JSON.stringify(body)}`)
  }
  return id
}

async function deletePolicyPack(id: string): Promise<void> {
  try {
    await fetch(`${base}${POLICY_PACKS_PATH}/${id}`, { method: "DELETE" })
  } catch {
    // Best-effort cleanup; ignore failures
  }
}

// --- Fixture ---

let policyPackId: string

beforeAll(async () => {
  const healthRes = await fetch(`${base}/api/health`).catch((e) => {
    throw new Error(`Health check failed: ${e}`)
  })
  if (!healthRes.ok) {
    throw new Error(`Health check returned ${healthRes.status}`)
  }

  policyPackId = await createTestPolicyPack()
  expect(policyPackId).toMatch(UUID_REGEX)
})

afterAll(async () => {
  if (policyPackId) await deletePolicyPack(policyPackId)
})

// --- Tests ---

describe("POST /api/decisions/evaluate-agentic (integration)", () => {
  it("returns 200 with valid outcome when body is valid, or 400/500/503 on failure", async () => {
    const res = await postEvaluateAgentic({
      eventType: "DOCUMENT_VALIDATION",
      eventData: { vendor_name: "Test Vendor", document_text: "Sample contract" },
      policyPackId,
      mode: "Test",
    })

    expect(ALLOWED_STATUSES).toContain(res.status)

    if (res.status !== 200) return

    const body = (await res.json()) as EvaluateAgenticSuccess | EvaluateAgenticError
    expect(body.success).toBe(true)
    if (!body.success) return

    const { outcome, confidence, risk_score } = body.data
    expect(VALID_OUTCOMES).toContain(outcome)
    expect(typeof confidence).toBe("number")
    expect(typeof risk_score).toBe("number")
  })

  it("returns 400 when eventType or eventData is missing", async () => {
    const res = await postEvaluateAgentic({})
    expect(res.status).toBe(400)
  })

  it("returns 400 when policyPackId is missing and error mentions policy pack", async () => {
    const res = await postEvaluateAgentic({
      eventType: "DOCUMENT_VALIDATION",
      eventData: { vendor_name: "Test" },
    })

    expect(res.status).toBe(400)
    const errorMessage = await parseErrorMessage(res)
    expect(errorMessage).toMatch(/policyPackId|policy pack/i)
  })
})
