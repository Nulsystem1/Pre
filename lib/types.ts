// Core domain types for NUL Compliance Control Center

// ============================================
// Policy Pack & Chunk Types (Supabase)
// ============================================

export type PolicyPackStatus = "draft" | "review" | "active" | "archived"

export interface PolicyPack {
  id: string
  name: string
  version: string
  status: PolicyPackStatus
  raw_content: string | null
  created_at: string
  published_at: string | null
  description?: string
}

export interface PolicyChunk {
  id: string
  policy_pack_id: string
  content: string
  section_ref: string | null
  embedding: number[] | null
  metadata: Record<string, unknown>
}

// ============================================
// Graph Node & Edge Types (Neo4j)
// ============================================

export type NodeType =
  | "threshold"
  | "entity_type"
  | "action"
  | "condition"
  | "risk_factor"
  | "document_type"
  | "jurisdiction"

export type RelationshipType = "TRIGGERS" | "CASCADES_TO" | "REQUIRES" | "OVERRIDES" | "APPLIES_TO" | "EXEMPTS"

export interface GraphNode {
  id: string
  policy_pack_id: string
  node_type: NodeType
  label: string
  properties: Record<string, unknown>
  source_text?: string
  position?: { x: number; y: number }
}

export interface GraphEdge {
  id: string
  policy_pack_id: string
  source_node_id: string
  target_node_id: string
  relationship: RelationshipType
  properties?: Record<string, unknown>
}

export interface PolicyGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// ============================================
// Execution Target Types
// ============================================

export type ExecutionTargetType = "Task" | "Webhook" | "AgentStub"

export interface ExecutionTarget {
  id: string
  name: string
  type: ExecutionTargetType
  description: string | null
  integration_label: string | null
  config: Record<string, unknown>
  enabled: boolean
  created_at: string
}

// ============================================
// Control Types (JSON Logic based)
// ============================================

export type ControlAction = "APPROVE" | "REVIEW" | "BLOCK"


export interface Control {
  id: string
  policy_pack_id: string
  control_id: string // e.g., "KYC-001"
  name: string
  description: string | null
  condition_readable: string // Human-readable version
  action: ControlAction
  risk_weight: number
  enabled: boolean
  execution_target_id: string | null
  confidence_threshold: number
  source_node_ids: string[]
  ai_reasoning: string | null
  created_at: string
}

// ============================================
// Event (generic; payload shape is not fixed)
// ============================================

export interface Event {
  id: string
  event_type: string
  entity_id: string
  payload: Record<string, unknown>
  received_at: string
}

// ============================================
// Decision & Audit Types
// ============================================

/** Outcome of a compliance decision (agent or rule-based). */
export type DecisionOutcome = "APPROVED" | "REVIEW" | "BLOCKED"

/** How the decision was made: automated (above confidence threshold) or sent to human review. */
export type DecisionType = "AUTOMATED" | "HUMAN_REVIEW"

/** Compliance slot status for review_queue_payload (when outcome is HUMAN_REVIEW). */
export type ComplianceStatus = "SATISFIED" | "NOT_SATISFIED" | "UNKNOWN" | "NOT_APPLICABLE"

/** Compliance slots attached when outcome is REVIEW (human review). */
export interface ReviewQueueComplianceSlots {
  documentation: ComplianceStatus
  authority: ComplianceStatus
  eligibility: ComplianceStatus
  provider: ComplianceStatus
  cost_time: ComplianceStatus
  service_obligation: ComplianceStatus
  classification: ComplianceStatus
}

/** Payload attached to evaluation response when outcome is REVIEW (human review). */
export interface ReviewQueuePayload {
  compliance_slots: ReviewQueueComplianceSlots
  decision: "HUMAN_REVIEW"
  missing_information: string[]
}

/**
 * Decision record as returned by the audit API and used in Audit Explorer and Dashboard.
 * Sourced from command_center_results (and equivalent in-memory or DB).
 */
export interface AuditDecision {
  id: string
  created_at: string
  event_type: string
  event_data: Record<string, unknown>
  outcome: DecisionOutcome
  confidence: number
  risk_score: number
  reasoning: string
  agent_attempts?: number
  requires_human_review?: boolean
  matched_conditions?: string[] | Array<{ node: string; relationship?: string; target?: string }>
  agent_queries_used?: string[]
  /** Result from review queue when a case exists: e.g. Approved, Blocked, Escalated, Pending review. */
  review_queue_outcome?: string | null
  /** Confidence from the validation engine (status). */
  status_confidence?: number
  /** Confidence from the review queue outcome (e.g. after re-run); used as primary when present. */
  outcome_confidence?: number | null
}

/**
 * Decision result from Command Center validation (evaluate-agentic response, saved to results).
 * Richer than AuditDecision; normalized to AuditDecision when returned by GET /api/audit.
 */
export interface CommandCenterDecisionResult {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  outcome: DecisionOutcome
  confidence: number
  risk_score: number
  reasoning: string
  matched_policies: string[]
  recommended_actions?: string[]
  missing_information?: string[]
  agent_metadata?: {
    requires_human_review: boolean
    attempts: number
    search_queries?: string[]
    confidence_threshold?: number
  }
  policy_pack_id: string
  policy_pack_name: string
  policy_version: string
  validated_at: string
}

export interface Decision {
  id: string
  event_id: string
  control_id: string | null
  decision: DecisionOutcome
  risk_score: number | null
  matched_conditions: Record<string, unknown> | null
  ai_explanation: string | null
  created_at: string
  policy_pack_version: string
  control_snapshot: Control | null
}

export interface AuditRecord {
  id: string
  time: string
  event: Event
  decision: Decision
  decision_outcome: DecisionOutcome
  decision_type: DecisionType
  controls_evaluated: string[]
  controls_triggered: string[]
  processing_time_ms: number
}

// ============================================
// Case Types
// ============================================

export type CaseStatus = "open" | "in_review" | "resolved"
export type CaseResolution = "approved" | "blocked" | "escalated" | null

export interface Case {
  id: string
  decision_id: string
  customer_id: string
  customer_name: string
  reason: string
  risk_score: number
  status: CaseStatus
  resolution: CaseResolution
  assigned_to: string | null
  notes: string | null
  created_at: string
  resolved_at: string | null
}

// ============================================
// Review Queue Case (Human Review from Command Center)
// ============================================

export type ReviewQueueCaseStatus = "IN_REVIEW" | "ESCALATED" | "NEEDS_INFO" | "FINALIZED"

export type CaseAttachmentType = "SF_182" | "CSA" | "EMERGENCY_MEMO" | "IDP" | "OTHER"

export interface CaseAttachment {
  type: CaseAttachmentType
  file_id?: string
  description?: string
  uploaded_by: string
  uploaded_at: string
}

export interface ReviewQueueCaseValidationResult {
  event_type: string
  policy_pack_name: string
  policy_version: string
  outcome: string
  decision_type: string
  risk_score: number
  confidence: number
  event_data?: Record<string, unknown>
  explanations?: { bullets: string[] }
  matched_policies?: Array<{ node: string; relationship?: string; target?: string }>
  review?: {
    reasons: Record<string, string>
    policy_implications?: string[]
    recommended_actions?: unknown[]
    missing_fields?: string[]
    not_fulfilled?: string[]
  }
}

export interface ReviewQueueCase {
  id: string
  case_id: string
  status: ReviewQueueCaseStatus
  assigned_to: string | null
  validation_result: ReviewQueueCaseValidationResult
  attachments: CaseAttachment[]
  audit_log: Array<{ timestamp: string; action: string; actor: string; details?: unknown }>
  structured_edits?: Record<string, unknown>
  command_center_result_id?: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Audit Event Types
// ============================================

export interface AuditEvent {
  id: string
  timestamp: string
  event_type: string
  description: string
  actor: string | null
  document_id: string | null
  rule_id: string | null
  review_item_id: string | null
  decision_id: string | null
  metadata: Record<string, unknown>
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PolicyIngestionResult {
  policy_pack_id: string
  chunks_created: number
  graph_nodes_created: number
  graph_edges_created: number
}

export interface ControlGenerationResult {
  controls: Control[]
  generation_time_ms: number
}

