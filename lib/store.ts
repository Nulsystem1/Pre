// In-memory store for demo purposes
// In production, this would be Supabase + Neo4j

import type { PolicyPack, PolicyChunk, GraphNode, GraphEdge, Control, Event, Decision, Case } from "./types"

// ============================================
// Policy Packs Store
// ============================================

export const policyPacks: PolicyPack[] = [
  {
    id: "pack-kyc-v1.3",
    name: "KYC Pack",
    version: "1.3",
    status: "active",
    raw_content: `Customer Due Diligence Requirements:

1. Identity Verification
All customers must provide government-issued photo ID before account opening. If ID cannot be verified automatically, block the onboarding process.

2. Address Verification
For customers with risk scores above 50, address verification is mandatory. Request additional proof of address documentation if not verified.

3. High-Risk Jurisdictions
Customers from high-risk jurisdictions (as defined by FATF grey list) require enhanced due diligence and must be escalated for manual compliance review.

4. Age Verification
No accounts may be opened for individuals under 18 years of age. This is a hard block with no exceptions.

5. Duplicate Detection
Check for duplicate accounts using email and phone number matching. Flag for review if potential duplicate detected.

6. PEP Screening
All customers must be screened against PEP (Politically Exposed Person) databases. If match confidence exceeds 70%, escalate for enhanced due diligence.

7. Source of Funds
For transactions above $10,000, require documentation of source of funds. Business accounts require this for any transaction above $50,000.`,
    created_at: "2025-01-10T08:00:00Z",
    published_at: "2025-01-12T14:30:00Z",
    description: "Know Your Customer compliance controls for onboarding",
  },
  {
    id: "pack-aml-v1.3",
    name: "AML Pack",
    version: "1.3",
    status: "active",
    raw_content: `Anti-Money Laundering Controls:

1. Transaction Velocity Monitoring
Flag transactions that exceed 5x the customer's 90-day average. Apply enhanced scrutiny for sudden spikes.

2. Structuring Detection
Detect potential structuring behavior: multiple transactions just below $10,000 reporting threshold within 24 hours.

3. High-Value Wire Transfers
Wire transfers above $25,000 to high-risk countries require enhanced review.

4. Cash Deposit Patterns
Monitor for unusual cash deposit patterns. Flag if total cash deposits exceed $15,000 in a rolling 7-day window.

5. Shell Company Indicators
Enhanced due diligence for business accounts with characteristics of shell companies: nominee directors, bearer shares, complex ownership structures.`,
    created_at: "2025-01-08T10:00:00Z",
    published_at: "2025-01-09T16:00:00Z",
    description: "Anti-Money Laundering transaction monitoring controls",
  },
  {
    id: "pack-sanctions-v2.1",
    name: "Sanctions Screening",
    version: "2.1",
    status: "active",
    raw_content: `Sanctions Screening Policy:

1. OFAC Screening
All customers and counterparties must be screened against OFAC SDN list before any transaction. Automatic block on confirmed match.

2. EU Sanctions
Screen against EU consolidated sanctions list. Block transactions involving sanctioned entities or jurisdictions.

3. UN Sanctions
Comply with all UN Security Council sanction resolutions. No transactions permitted with designated entities.

4. Secondary Sanctions
Monitor for potential secondary sanctions exposure through indirect transactions.

5. Country-Based Restrictions
Block all transactions to/from: North Korea, Iran, Syria, Cuba, Crimea region. Review required for: Russia, Belarus, Venezuela, Myanmar.`,
    created_at: "2025-01-05T12:00:00Z",
    published_at: "2025-01-06T09:00:00Z",
    description: "Global sanctions screening and compliance",
  },
  {
    id: "pack-pep-v1.0",
    name: "PEP Monitoring",
    version: "1.0",
    status: "draft",
    raw_content: null,
    created_at: "2025-01-14T08:00:00Z",
    published_at: null,
    description: "Politically Exposed Persons monitoring (draft)",
  },
]

// ============================================
// Policy Chunks Store (for Linear RAG)
// ============================================

export const policyChunks: PolicyChunk[] = [
  {
    id: "chunk-1",
    policy_pack_id: "pack-kyc-v1.3",
    content:
      "All customers must provide government-issued photo ID before account opening. If ID cannot be verified automatically, block the onboarding process.",
    section_ref: "Section 1: Identity Verification",
    embedding: null,
    metadata: { priority: "critical", action: "block" },
  },
  {
    id: "chunk-2",
    policy_pack_id: "pack-kyc-v1.3",
    content:
      "For customers with risk scores above 50, address verification is mandatory. Request additional proof of address documentation if not verified.",
    section_ref: "Section 2: Address Verification",
    embedding: null,
    metadata: { priority: "high", action: "request_docs" },
  },
  {
    id: "chunk-3",
    policy_pack_id: "pack-kyc-v1.3",
    content:
      "Customers from high-risk jurisdictions (as defined by FATF grey list) require enhanced due diligence and must be escalated for manual compliance review.",
    section_ref: "Section 3: High-Risk Jurisdictions",
    embedding: null,
    metadata: { priority: "high", action: "review" },
  },
]

// ============================================
// Graph Nodes Store (for Graph RAG)
// ============================================

export const graphNodes: GraphNode[] = [
  // KYC Pack nodes
  {
    id: "node-1",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "condition",
    label: "ID Not Verified",
    properties: { field: "id_verified", operator: "equals", value: false },
    source_text: "If ID cannot be verified automatically",
    position: { x: 100, y: 100 },
  },
  {
    id: "node-2",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "action",
    label: "Block Onboarding",
    properties: { action_type: "BLOCK", severity: "critical" },
    source_text: "block the onboarding process",
    position: { x: 400, y: 100 },
  },
  {
    id: "node-3",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "threshold",
    label: "Risk Score > 50",
    properties: { field: "risk_score", operator: "greater_than", value: 50 },
    source_text: "risk scores above 50",
    position: { x: 100, y: 200 },
  },
  {
    id: "node-4",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "condition",
    label: "Address Not Verified",
    properties: { field: "address_verified", operator: "equals", value: false },
    source_text: "address verification is mandatory",
    position: { x: 250, y: 200 },
  },
  {
    id: "node-5",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "action",
    label: "Request Documentation",
    properties: { action_type: "REVIEW", severity: "medium", documents: ["proof_of_address"] },
    source_text: "Request additional proof of address documentation",
    position: { x: 400, y: 200 },
  },
  {
    id: "node-6",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "jurisdiction",
    label: "High-Risk Countries",
    properties: { countries: ["IR", "KP", "SY", "CU"], list_type: "FATF" },
    source_text: "high-risk jurisdictions (as defined by FATF grey list)",
    position: { x: 100, y: 300 },
  },
  {
    id: "node-7",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "action",
    label: "Enhanced Due Diligence",
    properties: { action_type: "REVIEW", severity: "high", requires_manual: true },
    source_text: "enhanced due diligence and must be escalated",
    position: { x: 400, y: 300 },
  },
  {
    id: "node-8",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "threshold",
    label: "Age < 18",
    properties: { field: "age", operator: "less_than", value: 18 },
    source_text: "individuals under 18 years of age",
    position: { x: 100, y: 400 },
  },
  {
    id: "node-9",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "action",
    label: "Hard Block",
    properties: { action_type: "BLOCK", severity: "critical", no_override: true },
    source_text: "hard block with no exceptions",
    position: { x: 400, y: 400 },
  },
  {
    id: "node-10",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "threshold",
    label: "PEP Match > 70%",
    properties: { field: "pep_match_confidence", operator: "greater_than", value: 0.7 },
    source_text: "match confidence exceeds 70%",
    position: { x: 100, y: 500 },
  },
  {
    id: "node-11",
    policy_pack_id: "pack-kyc-v1.3",
    node_type: "entity_type",
    label: "PEP Database",
    properties: { data_source: "world_check", screening_type: "pep" },
    source_text: "PEP (Politically Exposed Person) databases",
    position: { x: 250, y: 500 },
  },
]

// ============================================
// Graph Edges Store
// ============================================

export const graphEdges: GraphEdge[] = [
  {
    id: "edge-1",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-1",
    target_node_id: "node-2",
    relationship: "TRIGGERS",
  },
  {
    id: "edge-2",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-3",
    target_node_id: "node-4",
    relationship: "REQUIRES",
  },
  {
    id: "edge-3",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-4",
    target_node_id: "node-5",
    relationship: "TRIGGERS",
  },
  {
    id: "edge-4",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-6",
    target_node_id: "node-7",
    relationship: "TRIGGERS",
  },
  {
    id: "edge-5",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-8",
    target_node_id: "node-9",
    relationship: "TRIGGERS",
  },
  {
    id: "edge-6",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-10",
    target_node_id: "node-7",
    relationship: "TRIGGERS",
  },
  {
    id: "edge-7",
    policy_pack_id: "pack-kyc-v1.3",
    source_node_id: "node-11",
    target_node_id: "node-10",
    relationship: "APPLIES_TO",
  },
]

// ============================================
// Controls Store
// ============================================

export const controls: Control[] = [
  {
    id: "ctrl-1",
    policy_pack_id: "pack-kyc-v1.3",
    control_id: "KYC-001",
    name: "ID Verification Check",
    description: "Block onboarding if government ID is not verified",
    condition: {
      "==": [{ var: "customer.id_verified" }, false],
    },
    condition_readable: "customer.id_verified = false",
    action: "BLOCK",
    risk_weight: 1.0,
    enabled: true,
    source_node_ids: ["node-1", "node-2"],
    ai_reasoning: "Policy Section 1 mandates that all customers must have verified government ID. Automatic block prevents unauthorized account creation.",
    created_at: "2025-01-12T14:30:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-2",
    policy_pack_id: "pack-kyc-v1.3",
    control_id: "KYC-002",
    name: "Address Verification for High Risk",
    description: "Request address documentation for customers with elevated risk scores",
    condition: {
      and: [{ ">": [{ var: "customer.risk_score" }, 50] }, { "==": [{ var: "customer.address_verified" }, false] }],
    },
    condition_readable: "customer.risk_score > 50 AND customer.address_verified = false",
    action: "REVIEW",
    risk_weight: 0.7,
    enabled: true,
    source_node_ids: ["node-3", "node-4", "node-5"],
    ai_reasoning: "Policy Section 2 requires address verification for elevated risk customers. Review action allows analyst to request documentation.",
    created_at: "2025-01-12T14:30:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-3",
    policy_pack_id: "pack-kyc-v1.3",
    control_id: "KYC-003",
    name: "High-Risk Jurisdiction Review",
    description: "Enhanced due diligence for customers from FATF grey list countries",
    condition: {
      in: [{ var: "customer.country" }, ["IR", "KP", "SY", "CU", "MM", "VE", "BY", "RU"]],
    },
    condition_readable: "customer.country IN high_risk_countries",
    action: "REVIEW",
    risk_weight: 0.9,
    enabled: true,
    source_node_ids: ["node-6", "node-7"],
    ai_reasoning: "Policy Section 3 requires enhanced due diligence for high-risk jurisdictions. FATF grey list countries trigger manual review.",
    created_at: "2025-01-12T14:30:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-4",
    policy_pack_id: "pack-kyc-v1.3",
    control_id: "KYC-004",
    name: "Age Verification Block",
    description: "Hard block for underage customers with no override",
    condition: {
      "<": [{ var: "customer.age" }, 18],
    },
    condition_readable: "customer.age < 18",
    action: "BLOCK",
    risk_weight: 1.0,
    enabled: true,
    source_node_ids: ["node-8", "node-9"],
    ai_reasoning: "Policy Section 4 prohibits accounts for minors. This is a regulatory requirement with no exceptions.",
    created_at: "2025-01-12T14:30:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-5",
    policy_pack_id: "pack-kyc-v1.3",
    control_id: "KYC-005",
    name: "PEP Screening Alert",
    description: "Enhanced review for potential PEP matches above 70% confidence",
    condition: {
      and: [{ "==": [{ var: "customer.is_pep" }, true] }, { ">": [{ var: "customer.pep_match_confidence" }, 0.7] }],
    },
    condition_readable: "customer.is_pep = true AND customer.pep_match_confidence > 0.7",
    action: "REVIEW",
    risk_weight: 0.85,
    enabled: true,
    source_node_ids: ["node-10", "node-11", "node-7"],
    ai_reasoning: "Policy Section 6 requires enhanced due diligence for PEP customers. High confidence matches escalate to compliance team.",
    created_at: "2025-01-12T14:30:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-6",
    policy_pack_id: "pack-aml-v1.3",
    control_id: "AML-001",
    name: "Transaction Velocity Alert",
    description: "Flag transactions exceeding 5x the 90-day average",
    condition: {
      ">": [{ var: "transaction.velocity_ratio" }, 5],
    },
    condition_readable: "transaction.velocity_ratio > 5",
    action: "REVIEW",
    risk_weight: 0.75,
    enabled: true,
    source_node_ids: [],
    ai_reasoning: "AML Policy Section 1 monitors for unusual transaction velocity. Sudden spikes may indicate account takeover or money laundering.",
    created_at: "2025-01-09T16:00:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-7",
    policy_pack_id: "pack-aml-v1.3",
    control_id: "AML-002",
    name: "High-Value Wire Transfer Review",
    description: "Enhanced review for wire transfers above $25,000 to high-risk countries",
    condition: {
      and: [
        { "==": [{ var: "transaction.type" }, "wire_transfer"] },
        { ">": [{ var: "transaction.amount" }, 25000] },
        { in: [{ var: "transaction.destination_country" }, ["IR", "KP", "SY", "CU", "RU", "BY"]] },
      ],
    },
    condition_readable: "transaction.type = 'wire_transfer' AND amount > 25000 AND destination IN high_risk",
    action: "REVIEW",
    risk_weight: 0.9,
    enabled: true,
    source_node_ids: [],
    ai_reasoning: "AML Policy Section 3 requires enhanced scrutiny for high-value transfers to risky destinations.",
    created_at: "2025-01-09T16:00:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
  {
    id: "ctrl-8",
    policy_pack_id: "pack-sanctions-v2.1",
    control_id: "SANCT-001",
    name: "Sanctioned Country Block",
    description: "Block all transactions to/from sanctioned jurisdictions",
    condition: {
      or: [
        { in: [{ var: "customer.country" }, ["KP", "IR", "SY", "CU"]] },
        { in: [{ var: "transaction.destination_country" }, ["KP", "IR", "SY", "CU"]] },
      ],
    },
    condition_readable: "country OR destination IN sanctioned_list",
    action: "BLOCK",
    risk_weight: 1.0,
    enabled: true,
    source_node_ids: [],
    ai_reasoning: "Sanctions Policy Section 5 mandates blocking all transactions involving OFAC sanctioned countries. No exceptions.",
    created_at: "2025-01-06T09:00:00Z",
    execution_target_id: null,
    confidence_threshold: 0
  },
]

// ============================================
// Events Store (simulated incoming events)
// ============================================

export const events: Event[] = [
  {
    id: "evt-1001",
    event_type: "ONBOARDING",
    entity_id: "cus-48291",
    payload: {
      customer_id: "cus-48291",
      name: "James Morrison",
      email: "james.morrison@email.com",
      country: "US",
      is_pep: false,
      id_verified: true,
      address_verified: true,
      age: 34,
      risk_score: 28,
      account_type: "personal",
      created_at: "2025-01-14T10:32:45Z",
    },
    received_at: "2025-01-14T10:32:45Z",
  },
  {
    id: "evt-1000",
    event_type: "TRANSACTION",
    entity_id: "txn-892741",
    payload: {
      transaction_id: "txn-892741",
      customer_id: "cus-48285",
      amount: 45200,
      currency: "USD",
      type: "wire_transfer",
      destination_country: "CH",
      timestamp: "2025-01-14T10:32:21Z",
    },
    received_at: "2025-01-14T10:32:21Z",
  },
]

// ============================================
// Decisions Store
// ============================================

export const decisions: Decision[] = [
  {
    id: "dec-1",
    event_id: "evt-1001",
    control_id: null,
    decision: "APPROVED",
    risk_score: 28,
    matched_conditions: null,
    ai_explanation:
      "Customer passed all KYC controls. ID verified, address verified, not from high-risk jurisdiction, age verified, no PEP match.",
    created_at: "2025-01-14T10:32:45Z",
    policy_pack_version: "KYC Pack v1.3",
    control_snapshot: null,
  },
]

// ============================================
// Cases Store
// ============================================

export const cases: Case[] = [
  {
    id: "case-1001",
    decision_id: "dec-2",
    customer_id: "cus-48285",
    customer_name: "Robert Chen",
    reason: "Transaction Velocity Alert",
    risk_score: 78,
    status: "open",
    resolution: null,
    assigned_to: null,
    notes: null,
    created_at: "2025-01-14T10:32:21Z",
    resolved_at: null,
  },
  {
    id: "case-1002",
    decision_id: "dec-3",
    customer_id: "cus-48289",
    customer_name: "Marcus Thompson",
    reason: "PEP Screening Match (78%)",
    risk_score: 72,
    status: "in_review",
    resolution: null,
    assigned_to: "Sarah Chen",
    notes: "Requesting additional documentation on source of wealth.",
    created_at: "2025-01-14T10:30:52Z",
    resolved_at: null,
  },
]

// ============================================
// Utility functions for store manipulation
// ============================================

export function getActivePolicyPack(): PolicyPack | undefined {
  return policyPacks.find((p) => p.status === "active")
}

export function getControlsByPolicyPack(policyPackId: string): Control[] {
  return controls.filter((c) => c.policy_pack_id === policyPackId)
}

export function getEnabledControls(): Control[] {
  return controls.filter((c) => c.enabled)
}

export function getGraphByPolicyPack(policyPackId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: graphNodes.filter((n) => n.policy_pack_id === policyPackId),
    edges: graphEdges.filter((e) => e.policy_pack_id === policyPackId),
  }
}
