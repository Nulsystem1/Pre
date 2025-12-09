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
// Control Types (JSON Logic based)
// ============================================

export type ControlAction = "APPROVE" | "REVIEW" | "BLOCK"

export interface JSONLogicCondition {
  and?: JSONLogicCondition[]
  or?: JSONLogicCondition[]
  "=="?: [unknown, unknown]
  "!="?: [unknown, unknown]
  ">"?: [unknown, unknown]
  ">="?: [unknown, unknown]
  "<"?: [unknown, unknown]
  "<="?: [unknown, unknown]
  in?: [unknown, unknown[]]
  var?: string
  [key: string]: unknown
}

export interface Control {
  id: string
  policy_pack_id: string
  control_id: string // e.g., "KYC-001"
  name: string
  description: string | null
  condition: JSONLogicCondition
  condition_readable: string // Human-readable version
  action: ControlAction
  risk_weight: number
  enabled: boolean
  source_node_ids: string[]
  ai_reasoning: string | null
  created_at: string
}

// ============================================
// Event Types (for simulation)
// ============================================

export type EventType = "ONBOARDING" | "TRANSACTION" | "ACCOUNT_UPDATE" | "KYC_REFRESH"

export interface CustomerData {
  customer_id: string
  name: string
  email?: string
  country: string
  is_pep: boolean
  pep_match_confidence?: number
  id_verified: boolean
  address_verified: boolean
  age: number
  risk_score: number
  account_type: "personal" | "business"
  source_of_funds?: string
  occupation?: string
  created_at: string
}

export interface TransactionData {
  transaction_id: string
  customer_id: string
  amount: number
  currency: string
  type: "wire_transfer" | "card_payment" | "ach" | "internal"
  destination_country?: string
  destination_account?: string
  merchant_category?: string
  timestamp: string
}

export interface Event {
  id: string
  event_type: EventType
  entity_id: string
  payload: CustomerData | TransactionData | Record<string, unknown>
  received_at: string
}

// ============================================
// Decision & Audit Types
// ============================================

export type DecisionOutcome = "APPROVED" | "REVIEW" | "BLOCKED"

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

export interface EventSimulationResult {
  event: Event
  decisions: Decision[]
  final_outcome: DecisionOutcome
  case_created: boolean
  case_id?: string
}
