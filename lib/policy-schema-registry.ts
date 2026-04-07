import type { NormalizedCase, FieldPresence } from "./case-normalization"

/**
 * Policy schema registry
 *
 * This is intentionally simple for the demo: schemas are keyed by
 * event_type patterns and field paths. In a production system this
 * would likely be stored in the database and editable from the UI.
 *
 * Note: field keys here are generic identifiers and paths are
 * resolved against the normalized case (source/timing) or the
 * underlying raw_event payload. They are not limited to any
 * specific domain like "customer" or "vendor".
 */

export type PolicyFieldKey = string

export interface PolicyFieldSpec {
  key: PolicyFieldKey
  label: string
  /**
   * Path into raw_event for explainability (not used for access).
   * Example: "customer.id_verified".
   */
  path: string
}

export interface PolicySchema {
  id: string
  name: string
  /** Optional tag for a specific policy pack; currently unused for generic schema. */
  policy_pack_id?: string | null
  required_fields: PolicyFieldSpec[]
  optional_fields: PolicyFieldSpec[]
  blocking_fields: PolicyFieldSpec[]
  /**
   * Human-readable evaluation order (scope → actor → action → object → source → timing
   * → conditions → exceptions → decision). Purely descriptive but useful for docs/UI.
   */
  decision_order: string[]
  /** Free-form notes that describe how evidence should be interpreted. */
  evidence_rules: string[]
}

export interface PolicyValidationIssue {
  field: PolicyFieldSpec
  reason: "MISSING" | "UNKNOWN"
}

export interface PolicyValidationResult {
  schema: PolicySchema
  is_blocking_satisfied: boolean
  missing_blocking: PolicyValidationIssue[]
  missing_required: PolicyValidationIssue[]
  summary: string
}

// Single, generic policy schema.
// This focuses on universal evidence that should exist for any policy evaluation:
// - an identifiable actor, action, and object
// - clear source authority and effective date for the policy/evidence
// - basic timing information for the event
const GENERIC_POLICY_SCHEMA: PolicySchema = {
  id: "generic-policy",
  name: "Generic Policy Evaluation Schema",
  policy_pack_id: null,
  required_fields: [
    {
      key: "actor.type",
      label: "Actor type (who is involved)",
      path: "actor.type",
    },
    {
      key: "action",
      label: "Action being evaluated",
      path: "action",
    },
    {
      key: "object",
      label: "Object / subject of the action",
      path: "object",
    },
    {
      key: "source_authority",
      label: "Source authority (policy / document / system)",
      path: "source.authority",
    },
    {
      key: "source_effective_date",
      label: "Source effective date",
      path: "source.effective_date",
    },
  ],
  optional_fields: [
    {
      key: "timing.event_time",
      label: "Event time",
      path: "timing.event_time",
    },
  ],
  // For the fully generic schema we do not treat any fields as
  // hard blocking. Instead we surface missing fields to the LLM
  // and to the human reviewer, and reserve blocking semantics for
  // future, explicit per‑policy schemas.
  blocking_fields: [],
  decision_order: [
    "scope",
    "actor",
    "action",
    "object",
    "source",
    "timing",
    "conditions",
    "exceptions",
    "decision",
  ],
  evidence_rules: [
    "Evidence must indicate the authoritative source for the policy or document (e.g., policy name, SF‑182 record, official training system, or sanctions list).",
    "Evidence must specify when the policy or document became effective relative to the event time.",
    "The actor, action, and object must be identifiable before automated reasoning is trusted.",
  ],
}

/**
 * Very small in‑memory registry. For now we only ship a single
 * generic schema that applies to all policies. In the future,
 * additional per‑policy schemas can be layered on top.
 */
export function getPolicySchemaForCase(caseObj: NormalizedCase): PolicySchema | null {
  // Currently always return the generic schema; selection by policy_pack_id or
  // event_type can be added later without changing the validator contract.
  void caseObj // appease unused param lint in case of future extensions
  return GENERIC_POLICY_SCHEMA
}

export function validateCaseAgainstSchema(
  caseObj: NormalizedCase,
  schema: PolicySchema
): PolicyValidationResult {
  const missing_blocking: PolicyValidationIssue[] = []
  const missing_required: PolicyValidationIssue[] = []

  const getFieldPresence = (field: PolicyFieldSpec): FieldPresence => {
    const segments = field.path.split(".")
    if (segments[0] === "source") {
      const key = segments[1] as keyof NormalizedCase["source"]
      const value = caseObj.source[key]
      return value === undefined ? "MISSING" : "PRESENT"
    }
    if (segments[0] === "timing") {
      const key = segments[1] as keyof NormalizedCase["timing"]
      const value = caseObj.timing[key]
      return value === undefined ? "MISSING" : "PRESENT"
    }

    // Fallback: traverse raw_event payload using the path
    let current: unknown = caseObj.raw_event
    for (const seg of segments) {
      if (current && typeof current === "object" && seg in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[seg]
      } else {
        current = undefined
        break
      }
    }
    if (current === null) return "UNKNOWN"
    if (current === undefined) return "MISSING"
    return "PRESENT"
  }

  const classify = (field: PolicyFieldSpec, isBlocking: boolean) => {
    const status = getFieldPresence(field)
    if (status === "PRESENT") return
    const issue: PolicyValidationIssue = {
      field,
      reason: status === "MISSING" ? "MISSING" : "UNKNOWN",
    }
    if (isBlocking) {
      missing_blocking.push(issue)
    } else {
      missing_required.push(issue)
    }
  }

  schema.blocking_fields.forEach((f) => classify(f, true))
  schema.required_fields.forEach((f) => classify(f, false))

  const is_blocking_satisfied = missing_blocking.length === 0

  const allMissing = [...missing_blocking, ...missing_required]
  const summary =
    allMissing.length === 0
      ? "All required and blocking fields are satisfied for this policy schema."
      : `Missing or unknown fields for this policy schema: ${allMissing
          .map((m) => `${m.field.label} [${m.reason}]`)
          .join("; ")}.`

  return {
    schema,
    is_blocking_satisfied,
    missing_blocking,
    missing_required,
    summary,
  }
}

