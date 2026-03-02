/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"

/**
 * Decision priority rule: BLOCK > REVIEW > APPROVE.
 * Risk score = average(triggered controls' risk_weight) * 100.
 * These are the critical business rules for the decision engine.
 */

type Outcome = "APPROVED" | "REVIEW" | "BLOCKED"
type Action = Outcome

function applyDecisionPriority(actions: Action[]): Outcome {
  if (actions.some((a) => a === "BLOCKED")) return "BLOCKED"
  if (actions.some((a) => a === "REVIEW")) return "REVIEW"
  return "APPROVED"
}

function compositeRiskScore(riskWeights: number[]): number {
  if (riskWeights.length === 0) return 0
  return (riskWeights.reduce((a, b) => a + b, 0) / riskWeights.length) * 100
}

describe("Decision priority (business rule)", () => {
  it("returns BLOCKED when any control triggers BLOCK", () => {
    expect(applyDecisionPriority(["APPROVED", "REVIEW", "BLOCKED"])).toBe("BLOCKED")
    expect(applyDecisionPriority(["BLOCKED"])).toBe("BLOCKED")
  })

  it("returns REVIEW when no BLOCK but any REVIEW", () => {
    expect(applyDecisionPriority(["APPROVED", "REVIEW"])).toBe("REVIEW")
    expect(applyDecisionPriority(["REVIEW"])).toBe("REVIEW")
  })

  it("returns APPROVED when only APPROVE actions", () => {
    expect(applyDecisionPriority(["APPROVED"])).toBe("APPROVED")
    expect(applyDecisionPriority(["APPROVED", "APPROVED"])).toBe("APPROVED")
  })
})

describe("Composite risk score (calculation)", () => {
  it("returns 0 when no triggered controls", () => {
    expect(compositeRiskScore([])).toBe(0)
  })

  it("returns average of risk_weights * 100", () => {
    expect(compositeRiskScore([0.5])).toBe(50)
    expect(compositeRiskScore([0.3, 0.7])).toBe(50)
    expect(compositeRiskScore([0.2, 0.4, 0.6])).toBeCloseTo(40)
  })
})
