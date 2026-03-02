/**
 * Decision guardrails used by the agentic evaluation path.
 * Pure functions so they can be unit-tested without API/DB.
 */

import type { DecisionOutcome } from "./types"

export const DEFAULT_CONFIDENCE_THRESHOLD = 0.8

/**
 * Apply confidence threshold guardrail:
 * - requiresHumanReview = confidence < threshold
 * - If outcome is APPROVED but confidence is below threshold, override to REVIEW.
 */
export function applyConfidenceGuardrail(
  outcome: DecisionOutcome,
  confidence: number,
  threshold: number = DEFAULT_CONFIDENCE_THRESHOLD
): { outcome: DecisionOutcome; requiresHumanReview: boolean } {
  const requiresHumanReview = confidence < threshold
  const newOutcome: DecisionOutcome =
    requiresHumanReview && outcome === "APPROVED" ? "REVIEW" : outcome
  return { outcome: newOutcome, requiresHumanReview }
}

/** Valid decision outcomes. */
export const DECISION_OUTCOMES: DecisionOutcome[] = ["APPROVED", "REVIEW", "BLOCKED"]

/** Check if a string is a valid DecisionOutcome. */
export function isValidOutcome(value: unknown): value is DecisionOutcome {
  return typeof value === "string" && DECISION_OUTCOMES.includes(value as DecisionOutcome)
}

/** Clamp risk score to allowed range 0–100. */
export function clampRiskScore(risk: number): number {
  return Math.max(0, Math.min(100, Number(risk)))
}

/** Clamp confidence to allowed range 0–1. */
export function clampConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, Number(confidence)))
}
