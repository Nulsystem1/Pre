import type { PolicyGraph } from "./types"

/**
 * Simple, deterministic case normalization layer that converts
 * raw event data + context into a structured "case" object.
 *
 * This layer is deliberately conservative: it does NOT decide
 * outcomes, it only classifies what information is present,
 * missing, or unknown so that policy schemas and the LLM can
 * reason on top.
 */

export type FieldPresence = "PRESENT" | "MISSING" | "UNKNOWN"

export interface NormalizedActor {
  type: "CUSTOMER" | "VENDOR" | "OTHER"
  id?: string
  name?: string
  raw?: Record<string, unknown>
}

export interface NormalizedSource {
  channel?: string
  authority?: string
  document_type?: string
  effective_date?: string
  raw?: Record<string, unknown>
}

export interface NormalizedTiming {
  event_time?: string
  policy_effective_date?: string
}

export interface NormalizedCase {
  event_type: string
  actor: NormalizedActor
  action: string
  object: string
  source: NormalizedSource
  timing: NormalizedTiming
  conditions: Record<string, FieldPresence>
  exceptions: string[]
  unknowns: string[]
  raw_event: Record<string, unknown>
  policy_graph_summary?: string
}

/**
 * Best‑effort extraction of actor/action/object/source/timing from
 * the raw event. This can be evolved over time without changing
 * downstream contracts.
 */
export function normalizeEventToCase(params: {
  eventType: string
  eventData: Record<string, unknown>
  policyGraph?: PolicyGraph
}): NormalizedCase {
  const { eventType, eventData, policyGraph } = params

  const customer = (eventData.customer ?? {}) as Record<string, unknown>
  const vendor = (eventData.vendor ?? {}) as Record<string, unknown>

  const actorType: NormalizedActor["type"] =
    Object.keys(customer).length > 0
      ? "CUSTOMER"
      : Object.keys(vendor).length > 0
        ? "VENDOR"
        : "OTHER"

  const actor: NormalizedActor = {
    type: actorType,
    id: (customer.id as string) ?? (vendor.id as string) ?? undefined,
    name: (customer.name as string) ?? (vendor.name as string) ?? undefined,
    raw: actorType === "CUSTOMER" ? customer : actorType === "VENDOR" ? vendor : undefined,
  }

  const action = eventType

  const object: string =
    (eventData.account ? "account" : undefined) ||
    (eventData.transaction ? "transaction" : undefined) ||
    (eventData.training ? "training" : undefined) ||
    "unknown"

  const sourceObj = (eventData.source ?? {}) as Record<string, unknown>
  const source: NormalizedSource = {
    channel: (sourceObj.channel as string) ?? undefined,
    authority: (sourceObj.authority as string) ?? undefined,
    document_type: (sourceObj.document_type as string) ?? undefined,
    effective_date: (sourceObj.effective_date as string) ?? undefined,
    raw: Object.keys(sourceObj).length > 0 ? sourceObj : undefined,
  }

  const timing: NormalizedTiming = {
    event_time: (eventData.event_time as string) ?? undefined,
    policy_effective_date: (eventData.policy_effective_date as string) ?? undefined,
  }

  const conditions: Record<string, FieldPresence> = {}
  if (customer && typeof customer === "object") {
    if ("id_verified" in customer) {
      conditions["customer.id_verified"] =
        customer.id_verified === true ? "PRESENT" : "MISSING"
    } else {
      conditions["customer.id_verified"] = "UNKNOWN"
    }
    if ("risk_score" in customer) {
      conditions["customer.risk_score"] = "PRESENT"
    } else {
      conditions["customer.risk_score"] = "UNKNOWN"
    }
  }

  if (vendor && typeof vendor === "object") {
    if ("sanctions_check" in vendor) {
      conditions["vendor.sanctions_check"] = "PRESENT"
    } else {
      conditions["vendor.sanctions_check"] = "UNKNOWN"
    }
  }

  const exceptions: string[] = []

  const unknowns: string[] = []
  if (!source.authority) unknowns.push("source_authority")
  if (!source.effective_date) unknowns.push("source_effective_date")

  let policyGraphSummary: string | undefined
  if (policyGraph) {
    const { nodes, edges } = policyGraph
    policyGraphSummary = nodes
      .map((n, i) => {
        const outgoing = edges
          .filter((e) => e.source_node_id === n.id)
          .map((e) => {
            const target = nodes.find((t) => t.id === e.target_node_id)
            return `→ [${e.relationship}] → ${target?.label}`
          })
          .join(", ")
        return `${i + 1}. [${n.node_type}] ${n.label}${outgoing ? ` ${outgoing}` : ""}`
      })
      .slice(0, 25)
      .join("\n")
  }

  return {
    event_type: eventType,
    actor,
    action,
    object,
    source,
    timing,
    conditions,
    exceptions,
    unknowns,
    raw_event: eventData,
    policy_graph_summary: policyGraphSummary,
  }
}

