"use client"

import { useState } from "react"
import { CasesTable } from "@/components/cases/cases-table"
import { CaseDetailDrawer } from "@/components/cases/case-detail-drawer"

export type Case = {
  id: string
  customer: string
  customerId: string
  country: string
  segment: string
  primaryReason: string
  riskScore: number
  status: "Open" | "Under Review" | "Pending Info" | "Closed"
  lastUpdated: string
  events: {
    type: string
    description: string
    timestamp: string
    decision?: string
  }[]
  controls: string[]
  explanation: string
}

const cases: Case[] = [
  {
    id: "CS-4821",
    customer: "Marcus Thompson",
    customerId: "CUS-48289",
    country: "United Kingdom",
    segment: "High-net-worth",
    primaryReason: "PEP screening match",
    riskScore: 72,
    status: "Open",
    lastUpdated: "10 min ago",
    events: [
      { type: "Onboarding", description: "Account application submitted", timestamp: "2025-01-14 09:15:22" },
      { type: "Check", description: "ID verification passed", timestamp: "2025-01-14 09:15:45" },
      { type: "Alert", description: "PEP screening flagged potential match", timestamp: "2025-01-14 09:16:02" },
      {
        type: "Decision",
        description: "Escalated for manual review",
        timestamp: "2025-01-14 09:16:02",
        decision: "Review",
      },
    ],
    controls: ["PEP-Screen-001", "TXN-Velocity-003"],
    explanation:
      "Customer matches a politically exposed person profile with 78% confidence. The matched individual is a former government official in the UK Treasury. Enhanced due diligence is required to verify the nature of funds and business relationship purpose.",
  },
  {
    id: "CS-4820",
    customer: "Elena Rodriguez",
    customerId: "CUS-48285",
    country: "Spain",
    segment: "Retail",
    primaryReason: "Unusual transaction pattern",
    riskScore: 58,
    status: "Under Review",
    lastUpdated: "25 min ago",
    events: [
      {
        type: "Transaction",
        description: "Wire transfer $45,000 to offshore account",
        timestamp: "2025-01-14 08:42:15",
      },
      { type: "Alert", description: "Transaction velocity threshold exceeded", timestamp: "2025-01-14 08:42:16" },
      {
        type: "Decision",
        description: "Transaction held for review",
        timestamp: "2025-01-14 08:42:16",
        decision: "Review",
      },
    ],
    controls: ["TXN-Velocity-003"],
    explanation:
      "Customer initiated a wire transfer that exceeded their typical transaction profile. The transaction amount is 5x higher than their 90-day average and the destination is a jurisdiction with elevated AML risk.",
  },
  {
    id: "CS-4819",
    customer: "Ahmed Hassan",
    customerId: "CUS-48280",
    country: "UAE",
    segment: "Business",
    primaryReason: "High-risk jurisdiction",
    riskScore: 85,
    status: "Pending Info",
    lastUpdated: "1 hour ago",
    events: [
      { type: "Onboarding", description: "Business account application", timestamp: "2025-01-14 07:30:00" },
      { type: "Check", description: "Business verification initiated", timestamp: "2025-01-14 07:30:15" },
      { type: "Alert", description: "Registered address in high-risk jurisdiction", timestamp: "2025-01-14 07:30:20" },
      {
        type: "Action",
        description: "Additional documentation requested",
        timestamp: "2025-01-14 07:45:00",
        decision: "Pending",
      },
    ],
    controls: ["JURIS-Risk-001", "BIZ-Verify-002"],
    explanation:
      "Business is registered in a jurisdiction flagged by FATF for strategic deficiencies in AML/CFT frameworks. Enhanced due diligence documentation has been requested including source of funds, beneficial ownership structure, and business purpose.",
  },
  {
    id: "CS-4818",
    customer: "Lisa Chen",
    customerId: "CUS-48275",
    country: "Singapore",
    segment: "Premium",
    primaryReason: "Sanctions list near-match",
    riskScore: 91,
    status: "Open",
    lastUpdated: "2 hours ago",
    events: [
      { type: "Transaction", description: "International wire $120,000", timestamp: "2025-01-14 06:15:00" },
      { type: "Alert", description: "Sanctions screening near-match detected", timestamp: "2025-01-14 06:15:02" },
      {
        type: "Decision",
        description: "Transaction blocked pending review",
        timestamp: "2025-01-14 06:15:02",
        decision: "Blocked",
      },
    ],
    controls: ["SANCT-Screen-001"],
    explanation:
      "Customer name shows 92% similarity to an individual on the OFAC SDN list. Manual verification required to confirm whether this is a true match or false positive. Transaction has been blocked pending resolution.",
  },
  {
    id: "CS-4817",
    customer: "Robert Miller",
    customerId: "CUS-48270",
    country: "United States",
    segment: "Retail",
    primaryReason: "Structuring suspicion",
    riskScore: 67,
    status: "Under Review",
    lastUpdated: "3 hours ago",
    events: [
      { type: "Transaction", description: "Multiple deposits totaling $29,500", timestamp: "2025-01-13 15:00:00" },
      { type: "Alert", description: "Potential structuring pattern detected", timestamp: "2025-01-13 15:00:05" },
      {
        type: "Decision",
        description: "Flagged for SAR consideration",
        timestamp: "2025-01-13 15:00:05",
        decision: "Review",
      },
    ],
    controls: ["STRUCT-Detect-001"],
    explanation:
      "Customer made 4 cash deposits over 48 hours, each under $10,000, totaling $29,500. Pattern is consistent with potential structuring to avoid CTR reporting requirements. SAR filing may be required.",
  },
]

export default function CasesPage() {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cases</h1>
        <p className="text-muted-foreground">Review and manage compliance cases requiring attention</p>
      </div>

      <CasesTable cases={cases} onSelectCase={setSelectedCase} />

      <CaseDetailDrawer caseData={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  )
}
