/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"
import {
  applyConfidenceGuardrail,
  DEFAULT_CONFIDENCE_THRESHOLD,
  isValidOutcome,
  clampRiskScore,
  clampConfidence,
  DECISION_OUTCOMES,
} from "@/lib/decision-guardrails"

describe("Confidence threshold (guardrail)", () => {
  it("uses default threshold 0.8", () => {
    expect(DEFAULT_CONFIDENCE_THRESHOLD).toBe(0.8)
  })

  it("requires human review when confidence is below threshold", () => {
    const r = applyConfidenceGuardrail("APPROVED", 0.75, 0.8)
    expect(r.requiresHumanReview).toBe(true)
  })

  it("does not require human review when confidence is at or above threshold", () => {
    expect(applyConfidenceGuardrail("APPROVED", 0.8, 0.8).requiresHumanReview).toBe(false)
    expect(applyConfidenceGuardrail("APPROVED", 0.9, 0.8).requiresHumanReview).toBe(false)
  })

  it("overrides APPROVED to REVIEW when confidence is below threshold", () => {
    const r = applyConfidenceGuardrail("APPROVED", 0.7, 0.8)
    expect(r.outcome).toBe("REVIEW")
    expect(r.requiresHumanReview).toBe(true)
  })

  it("does not change APPROVED when confidence is at or above threshold", () => {
    expect(applyConfidenceGuardrail("APPROVED", 0.85, 0.8).outcome).toBe("APPROVED")
  })

  it("does not change REVIEW or BLOCKED when below threshold", () => {
    expect(applyConfidenceGuardrail("REVIEW", 0.5, 0.8).outcome).toBe("REVIEW")
    expect(applyConfidenceGuardrail("BLOCKED", 0.5, 0.8).outcome).toBe("BLOCKED")
  })

  it("respects custom threshold", () => {
    const r = applyConfidenceGuardrail("APPROVED", 0.75, 0.7)
    expect(r.requiresHumanReview).toBe(false)
    expect(r.outcome).toBe("APPROVED")
  })
})

describe("Decision outcome types", () => {
  it("valid outcomes are APPROVED, REVIEW, BLOCKED", () => {
    expect(DECISION_OUTCOMES).toEqual(["APPROVED", "REVIEW", "BLOCKED"])
  })

  it("isValidOutcome accepts only valid outcomes", () => {
    expect(isValidOutcome("APPROVED")).toBe(true)
    expect(isValidOutcome("REVIEW")).toBe(true)
    expect(isValidOutcome("BLOCKED")).toBe(true)
    expect(isValidOutcome("")).toBe(false)
    expect(isValidOutcome("approved")).toBe(false)
    expect(isValidOutcome(null)).toBe(false)
    expect(isValidOutcome(1)).toBe(false)
  })
})

describe("Risk score (0–100)", () => {
  it("clampRiskScore clamps to 0–100", () => {
    expect(clampRiskScore(50)).toBe(50)
    expect(clampRiskScore(-10)).toBe(0)
    expect(clampRiskScore(150)).toBe(100)
    expect(clampRiskScore(0)).toBe(0)
    expect(clampRiskScore(100)).toBe(100)
  })
})

describe("Confidence (0–1)", () => {
  it("clampConfidence clamps to 0–1", () => {
    expect(clampConfidence(0.5)).toBe(0.5)
    expect(clampConfidence(-0.1)).toBe(0)
    expect(clampConfidence(1.5)).toBe(1)
    expect(clampConfidence(0)).toBe(0)
    expect(clampConfidence(1)).toBe(1)
  })
})
