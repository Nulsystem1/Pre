/**
 * Builds review_queue_payload for evaluation response when outcome is REVIEW (human review).
 * Maps LLM missing_information into compliance_slots; only included when outcome === "REVIEW".
 */

import type { DecisionOutcome } from "./types"
import type { ComplianceStatus, ReviewQueueComplianceSlots, ReviewQueuePayload } from "./types"

const SLOT_KEYS: (keyof ReviewQueueComplianceSlots)[] = [
  "documentation",
  "authority",
  "eligibility",
  "provider",
  "cost_time",
  "service_obligation",
  "classification",
]

const DEFAULT_SATISFIED: ReviewQueueComplianceSlots = {
  documentation: "SATISFIED",
  authority: "SATISFIED",
  eligibility: "SATISFIED",
  provider: "SATISFIED",
  cost_time: "SATISFIED",
  service_obligation: "SATISFIED",
  classification: "SATISFIED",
}

function lower(s: string): string {
  return s.toLowerCase()
}

/** Map missing_information (and optional recommended_actions) into compliance_slots. */
function mapMissingToSlots(missing: string[]): ReviewQueueComplianceSlots {
  const slots = { ...DEFAULT_SATISFIED }
  const combined = missing.map(lower)

  for (const item of combined) {
    if (/sf-?182|sf182/.test(item) || /sf-182 not confirmed/i.test(item)) {
      slots.documentation = "UNKNOWN"
    }
    if (/provider not barred|accreditation verification|provider.*verification/i.test(item)) {
      slots.provider = "UNKNOWN"
    }
    if (/approval authority|authority.*approval/i.test(item)) {
      slots.authority = "UNKNOWN"
    }
    if (/\bcsa\b|service obligation/i.test(item)) {
      slots.service_obligation = "UNKNOWN"
    }
    if (/eligibility|eligible/i.test(item)) {
      slots.eligibility = "UNKNOWN"
    }
    if (/cost|time|budget/i.test(item)) {
      slots.cost_time = "UNKNOWN"
    }
    if (/classification|classify/i.test(item)) {
      slots.classification = "UNKNOWN"
    }
  }

  return slots
}

/** Dedupe and normalize missing_information (preserve order, unique by lowercased value). */
function dedupeMissing(missing: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of missing) {
    const t = (s ?? "").trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

/**
 * Build review_queue_payload when outcome is REVIEW; otherwise return null.
 * Reuses and dedupes missing_information.
 */
export function buildReviewQueuePayload(
  outcome: DecisionOutcome,
  missing_information: string[] | undefined
): ReviewQueuePayload | null {
  if (outcome !== "REVIEW") {
    return null
  }
  const missing = dedupeMissing(missing_information ?? [])
  const compliance_slots = mapMissingToSlots(missing)
  return {
    compliance_slots,
    decision: "HUMAN_REVIEW",
    missing_information: missing,
  }
}
