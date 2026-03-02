"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Filter, ChevronRight } from "lucide-react"
type CaseRow = {
  id: string
  case_id: string
  name: string | null
  status: string
  assigned_to: string | null
  validation_result: {
    outcome?: string
    risk_score?: number
    confidence?: number
    policy_pack_name?: string
    policy_version?: string
    review?: { reasons?: Record<string, string> }
  }
  audit_log?: Array<{ action: string }>
  created_at: string
}

const OUTCOME_LABELS: Record<string, string> = {
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  BLOCKED: "BLOCKED",
  ESCALATED: "ESCALATED",
  NEEDS_INFO: "NEEDS_INFO",
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "NEEDS_INFO", label: "Needs info" },
  { value: "FINALIZED", label: "Finalized" },
]

export function ReviewQueueCasesList() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [highRiskOnly, setHighRiskOnly] = useState(false)
  const [myCasesOnly, setMyCasesOnly] = useState(false)

  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCases = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (highRiskOnly) params.set("high_risk_only", "true")
      if (myCasesOnly) params.set("assigned_to", "sarah chen")
      const res = await fetch(`/api/review-queue/cases?${params}`)
      const json = await res.json()
      if (json.success) {
        setCases(json.data ?? [])
      } else {
        setCases([])
        setLoadError(json.error || "Failed to load cases")
      }
    } catch (e) {
      setCases([])
      setLoadError("Failed to load cases. Run scripts/setup.sh to ensure the database tables exist.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [statusFilter, highRiskOnly, myCasesOnly])

  const effectiveOutcome = (c: CaseRow): string => {
    if (c.status === "FINALIZED" && Array.isArray(c.audit_log) && c.audit_log.length > 0) {
      const last = [...c.audit_log].reverse().find((e) => e.action === "APPROVE" || e.action === "BLOCK")
      if (last?.action === "APPROVE") return "APPROVED"
      if (last?.action === "BLOCK") return "BLOCKED"
    }
    if (c.status === "ESCALATED") return "ESCALATED"
    if (c.status === "NEEDS_INFO") return "NEEDS_INFO"
    return c.validation_result?.outcome ?? "IN_REVIEW"
  }

  const riskColor = (score: number | undefined) => {
    if (score == null) return "bg-muted"
    if (score >= 70) return "bg-red-500"
    if (score >= 50) return "bg-amber-500"
    return "bg-green-500"
  }

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "ESCALATED") return "destructive"
    if (s === "IN_REVIEW") return "secondary" // same style as REVIEW outcome (grey badge)
    if (s === "NEEDS_INFO") return "secondary"
    if (s === "FINALIZED") return "outline"
    return "default"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cases (from Command Center)</CardTitle>
        <CardDescription>
          Human review cases. Click a row to open case detail.
        </CardDescription>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="text-sm font-medium flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filters
          </span>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={myCasesOnly}
              onChange={(e) => setMyCasesOnly(e.target.checked)}
            />
            My cases
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={highRiskOnly}
              onChange={(e) => setHighRiskOnly(e.target.checked)}
            />
            High risk only
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {loadError ? (
          <div className="text-center py-12 text-destructive">
            <p>{loadError}</p>
            <p className="text-sm text-muted-foreground mt-2">Run: bash scripts/setup.sh (or setup.ps1 on Windows) to create review_queue_cases table.</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No cases yet. Every case created from Command Center appears here.</p>
            <p className="text-sm mt-2">In Command Center, validate data, then click a result → &quot;Create case&quot; (optional name). The case will show in this list.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Case ID</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Policy version</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/review-queue/cases/${c.id}`)}
                >
                  <TableCell>
                  <div className="font-medium">{c.name || c.case_id}</div>
                  {c.name && <div className="text-xs text-muted-foreground font-mono">{c.case_id}</div>}
                </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-2 rounded-full overflow-hidden ${riskColor(c.validation_result?.risk_score)}`} style={{ minWidth: 48 }} />
                      <span className="text-sm">{c.validation_result?.risk_score ?? "—"}/100</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        effectiveOutcome(c) === "APPROVED" ? "default" :
                        effectiveOutcome(c) === "BLOCKED" || effectiveOutcome(c) === "ESCALATED" ? "destructive" : "secondary"
                      }
                    >
                      {OUTCOME_LABELS[effectiveOutcome(c)] ?? effectiveOutcome(c)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.assigned_to ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {c.validation_result?.policy_pack_name ?? "—"} (v{c.validation_result?.policy_version ?? "—"})
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
