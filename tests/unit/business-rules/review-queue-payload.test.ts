/// <reference path="../../../vitest-env.d.ts" />
import { describe, it, expect } from "vitest"
import { buildReviewQueuePayload } from "@/lib/review-queue-payload"

describe("buildReviewQueuePayload", () => {
  it("REVIEW response includes review_queue_payload and compliance_slots has UNKNOWN for documentation/provider when those items are in missing_information", () => {
    const missing = [
      "SF-182 not confirmed",
      "Provider not barred / accreditation verification required",
    ]
    const payload = buildReviewQueuePayload("REVIEW", missing)
    expect(payload).not.toBeNull()
    expect(payload!.decision).toBe("HUMAN_REVIEW")
    expect(payload!.missing_information).toEqual(missing)
    expect(payload!.compliance_slots.documentation).toBe("UNKNOWN")
    expect(payload!.compliance_slots.provider).toBe("UNKNOWN")
    expect(payload!.compliance_slots.authority).toBe("SATISFIED")
    expect(payload!.compliance_slots.service_obligation).toBe("SATISFIED")
  })

  it("APPROVED response does not include review_queue_payload; BLOCKED does not include it", () => {
    const missing = ["Some missing field"]
    expect(buildReviewQueuePayload("APPROVED", missing)).toBeNull()
    expect(buildReviewQueuePayload("BLOCKED", missing)).toBeNull()
    expect(buildReviewQueuePayload("APPROVED", [])).toBeNull()
    expect(buildReviewQueuePayload("BLOCKED", [])).toBeNull()
  })

  it("dedupes missing_information and maps authority / CSA to UNKNOWN", () => {
    const payload = buildReviewQueuePayload("REVIEW", [
      "Approval authority not verified",
      "approval authority not verified",
      "CSA requirement unclear",
    ])
    expect(payload).not.toBeNull()
    expect(payload!.compliance_slots.authority).toBe("UNKNOWN")
    expect(payload!.compliance_slots.service_obligation).toBe("UNKNOWN")
    expect(payload!.missing_information).toHaveLength(2)
  })
})
