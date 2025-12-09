"use client"

import { useState } from "react"
import { AuditFilters } from "@/components/audit/audit-filters"
import { AuditTable } from "@/components/audit/audit-table"
import { AuditDetailModal } from "@/components/audit/audit-detail-modal"

export type AuditRecord = {
  id: string
  time: string
  entityType: "Customer" | "Transaction"
  entityId: string
  entityName: string
  decision: "Approved" | "Review" | "Blocked"
  control: string | null
  policyVersion: string
  actor: "System" | "Analyst"
  actorName?: string
  rawData: {
    event: Record<string, unknown>
    decision: Record<string, unknown>
  }
}

const auditRecords: AuditRecord[] = [
  {
    id: "AUD-928471",
    time: "2025-01-14 10:32:45",
    entityType: "Customer",
    entityId: "CUS-48291",
    entityName: "James Morrison",
    decision: "Approved",
    control: null,
    policyVersion: "KYC Pack v1.3",
    actor: "System",
    rawData: {
      event: {
        event_id: "EVT-9001",
        type: "customer_onboarding",
        customer_id: "CUS-48291",
        name: "James Morrison",
        country: "US",
        risk_score: 28,
        timestamp: "2025-01-14T10:32:45Z",
      },
      decision: {
        decision_id: "DEC-482910",
        outcome: "approved",
        controls_evaluated: ["KYC-001", "KYC-002", "KYC-003"],
        controls_triggered: [],
        confidence: 0.98,
        processing_time_ms: 45,
      },
    },
  },
  {
    id: "AUD-928470",
    time: "2025-01-14 10:32:21",
    entityType: "Transaction",
    entityId: "TXN-892741",
    entityName: "$45,200.00 Wire Transfer",
    decision: "Review",
    control: "TXN-Velocity-003",
    policyVersion: "AML Pack v1.3",
    actor: "System",
    rawData: {
      event: {
        event_id: "EVT-9000",
        type: "wire_transfer",
        transaction_id: "TXN-892741",
        amount: 45200.0,
        currency: "USD",
        customer_id: "CUS-48285",
        destination_country: "CH",
        timestamp: "2025-01-14T10:32:21Z",
      },
      decision: {
        decision_id: "DEC-482909",
        outcome: "review",
        controls_evaluated: ["TXN-001", "TXN-002", "TXN-Velocity-003"],
        controls_triggered: ["TXN-Velocity-003"],
        reason: "Transaction exceeds 90-day average by 5x",
        confidence: 0.92,
        processing_time_ms: 38,
      },
    },
  },
  {
    id: "AUD-928469",
    time: "2025-01-14 10:31:58",
    entityType: "Customer",
    entityId: "CUS-48290",
    entityName: "Sarah Williams",
    decision: "Approved",
    control: null,
    policyVersion: "KYC Pack v1.3",
    actor: "System",
    rawData: {
      event: {
        event_id: "EVT-8999",
        type: "customer_onboarding",
        customer_id: "CUS-48290",
        name: "Sarah Williams",
        country: "UK",
        risk_score: 15,
        timestamp: "2025-01-14T10:31:58Z",
      },
      decision: {
        decision_id: "DEC-482908",
        outcome: "approved",
        controls_evaluated: ["KYC-001", "KYC-002", "KYC-003"],
        controls_triggered: [],
        confidence: 0.99,
        processing_time_ms: 42,
      },
    },
  },
  {
    id: "AUD-928468",
    time: "2025-01-14 10:31:15",
    entityType: "Transaction",
    entityId: "TXN-892739",
    entityName: "$89,500.00 Wire Transfer",
    decision: "Blocked",
    control: "SANCT-Screen-001",
    policyVersion: "AML Pack v1.3",
    actor: "System",
    rawData: {
      event: {
        event_id: "EVT-8997",
        type: "wire_transfer",
        transaction_id: "TXN-892739",
        amount: 89500.0,
        currency: "USD",
        customer_id: "CUS-48275",
        destination_country: "RU",
        timestamp: "2025-01-14T10:31:15Z",
      },
      decision: {
        decision_id: "DEC-482907",
        outcome: "blocked",
        controls_evaluated: ["TXN-001", "SANCT-Screen-001"],
        controls_triggered: ["SANCT-Screen-001"],
        reason: "Destination country under sanctions",
        confidence: 1.0,
        processing_time_ms: 28,
      },
    },
  },
  {
    id: "AUD-928467",
    time: "2025-01-14 10:30:52",
    entityType: "Customer",
    entityId: "CUS-48289",
    entityName: "Marcus Thompson",
    decision: "Review",
    control: "PEP-Screen-001",
    policyVersion: "KYC Pack v1.3",
    actor: "System",
    rawData: {
      event: {
        event_id: "EVT-8996",
        type: "customer_onboarding",
        customer_id: "CUS-48289",
        name: "Marcus Thompson",
        country: "UK",
        risk_score: 72,
        timestamp: "2025-01-14T10:30:52Z",
      },
      decision: {
        decision_id: "DEC-482906",
        outcome: "review",
        controls_evaluated: ["KYC-001", "KYC-002", "PEP-Screen-001"],
        controls_triggered: ["PEP-Screen-001"],
        reason: "PEP match confidence 78%",
        confidence: 0.78,
        processing_time_ms: 156,
      },
    },
  },
  {
    id: "AUD-928466",
    time: "2025-01-14 09:45:30",
    entityType: "Customer",
    entityId: "CUS-48280",
    entityName: "Ahmed Hassan",
    decision: "Review",
    control: "JURIS-Risk-001",
    policyVersion: "KYC Pack v1.3",
    actor: "Analyst",
    actorName: "Sarah Chen",
    rawData: {
      event: {
        event_id: "EVT-8990",
        type: "manual_review",
        customer_id: "CUS-48280",
        action: "request_documentation",
        analyst_id: "USR-001",
        timestamp: "2025-01-14T09:45:30Z",
      },
      decision: {
        decision_id: "DEC-482900",
        outcome: "pending_documentation",
        documents_requested: ["source_of_funds", "beneficial_ownership", "business_purpose"],
        notes: "Enhanced due diligence required for high-risk jurisdiction",
      },
    },
  },
]

export default function AuditExplorerPage() {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null)
  const [filters, setFilters] = useState({
    dateRange: "today",
    decision: "all",
    control: "all",
    customer: "",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Explorer</h1>
        <p className="text-muted-foreground">Search and review the complete audit trail of all compliance decisions</p>
      </div>

      <AuditFilters filters={filters} onFiltersChange={setFilters} />
      <AuditTable records={auditRecords} onSelectRecord={setSelectedRecord} />
      <AuditDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  )
}
