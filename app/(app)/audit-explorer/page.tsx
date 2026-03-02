"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search, TrendingUp, TrendingDown, Minus, CheckCircle2, Mail, Webhook, FileText, MessageSquare, Database, Clock, AlertCircle } from "lucide-react"
import type { AuditDecision } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Generate execution steps based on decision outcome
const getExecutionSteps = (decision: AuditDecision) => {
  const baseSteps = [
    {
      delay: 0.1,
      icon: <Database className="h-4 w-4 text-blue-500" />,
      action: "Decision logged to compliance database",
      details: `ID: ${decision.id.substring(0, 8)}...`,
      status: "Completed",
    },
  ]

  if (decision.outcome === "APPROVED") {
    return [
      ...baseSteps,
      {
        delay: 0.3,
        icon: <Mail className="h-4 w-4 text-green-500" />,
        action: "Email notification sent to procurement team",
        details: "to: procurement@example.com",
        status: "Sent",
      },
      {
        delay: 0.8,
        icon: <Webhook className="h-4 w-4 text-purple-500" />,
        action: "Vendor data posted to ERP webhook",
        details: "POST https://api.example.com/vendors/onboard → 200 OK",
        status: "Success",
      },
      {
        delay: 1.2,
        icon: <FileText className="h-4 w-4 text-blue-500" />,
        action: "Jira ticket created",
        details: "COMPLIANCE-" + Math.floor(1000 + Math.random() * 9000),
        status: "Created",
      },
      {
        delay: 1.5,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        action: "Vendor record updated in CRM",
        details: "Salesforce: Status → Active",
        status: "Updated",
      },
    ]
  }

  if (decision.outcome === "REVIEW") {
    return [
      ...baseSteps,
      {
        delay: 0.3,
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        action: "Routed to human review queue",
        details: `Confidence: ${((decision.confidence || 0) * 100).toFixed(0)}% (below threshold)`,
        status: "Queued",
      },
      {
        delay: 0.5,
        icon: <Mail className="h-4 w-4 text-yellow-500" />,
        action: "Email sent to compliance manager",
        details: "to: compliance-manager@example.com",
        status: "Sent",
      },
      {
        delay: 0.8,
        icon: <MessageSquare className="h-4 w-4 text-yellow-500" />,
        action: "Slack alert posted",
        details: "#compliance-alerts: @compliance-team New item for review",
        status: "Posted",
      },
      {
        delay: 1.1,
        icon: <FileText className="h-4 w-4 text-yellow-500" />,
        action: "Jira ticket created (High Priority)",
        details: "COMPLIANCE-" + Math.floor(1000 + Math.random() * 9000),
        status: "Created",
      },
    ]
  }

  if (decision.outcome === "BLOCKED") {
    return [
      ...baseSteps,
      {
        delay: 0.2,
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        action: "Vendor blocked from onboarding",
        details: "Status: BLOCKED • Added to blocklist",
        status: "Blocked",
      },
      {
        delay: 0.4,
        icon: <MessageSquare className="h-4 w-4 text-red-500" />,
        action: "Urgent Slack alert posted",
        details: "#compliance-alerts: @channel Vendor blocked - high risk detected",
        status: "Posted",
      },
      {
        delay: 0.7,
        icon: <FileText className="h-4 w-4 text-red-500" />,
        action: "Jira ticket created (Critical)",
        details: "COMPLIANCE-" + Math.floor(1000 + Math.random() * 9000),
        status: "Created",
      },
      {
        delay: 1.0,
        icon: <Database className="h-4 w-4 text-red-500" />,
        action: "Risk profile updated in fraud detection system",
        details: "Risk score logged for pattern analysis",
        status: "Updated",
      },
    ]
  }

  return baseSteps
}

export default function AuditExplorerPage() {
  const [outcomeFilter, setOutcomeFilter] = useState("all")
  const [selectedDecision, setSelectedDecision] = useState<AuditDecision | null>(null)

  const { data, isLoading } = useSWR(
    outcomeFilter === "all" ? "/api/audit" : `/api/audit?outcome=${outcomeFilter}`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const decisions: AuditDecision[] = data?.data?.decisions ?? []

  // Count by Outcome (review queue result) when present, else by Status (decision from engine)
  const effectiveApproved = (d: AuditDecision) =>
    d.review_queue_outcome === "Approved" || (!d.review_queue_outcome && d.outcome === "APPROVED")
  const effectiveBlocked = (d: AuditDecision) =>
    d.review_queue_outcome === "Blocked" || (!d.review_queue_outcome && d.outcome === "BLOCKED")
  const effectiveReview = (d: AuditDecision) =>
    d.review_queue_outcome === "Pending review" ||
    d.review_queue_outcome === "Escalated" ||
    (!d.review_queue_outcome && d.outcome === "REVIEW")

  const stats = {
    total: decisions.length,
    approved: decisions.filter(effectiveApproved).length,
    blocked: decisions.filter(effectiveBlocked).length,
    review: decisions.filter(effectiveReview).length,
    avgConfidence: decisions.length > 0
      ? (decisions.reduce((sum, d) => sum + (Number(d.confidence) || 0), 0) / decisions.length).toFixed(2)
      : "0.00",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Explorer</h1>
          <p className="text-muted-foreground">All agent decisions and reasoning</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Human Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.review}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(parseFloat(stats.avgConfidence) * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="APPROVED">Approved Only</SelectItem>
                <SelectItem value="BLOCKED">Blocked Only</SelectItem>
                <SelectItem value="REVIEW">Human Review Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Decision History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : decisions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p>No decisions found</p>
              <p className="text-xs mt-1">Process some events in the Command Center</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((decision: AuditDecision) => (
                  <TableRow key={decision.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDecision(decision)}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(decision.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{decision.event_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          decision.outcome === "APPROVED" ? "default" :
                          decision.outcome === "BLOCKED" ? "destructive" :
                          "secondary"
                        }
                        className={
                          decision.outcome === "REVIEW"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : undefined
                        }
                      >
                        {decision.outcome === "REVIEW" ? "Human Review" : decision.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {decision.review_queue_outcome ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${(decision.confidence || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{((decision.confidence || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {decision.risk_score >= 70 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : decision.risk_score >= 40 ? (
                          <Minus className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">{decision.risk_score}/100</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {decision.agent_attempts ?? 0}/3
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Decision Detail Modal */}
      <Dialog open={!!selectedDecision} onOpenChange={() => setSelectedDecision(null)}>
        <DialogContent className="w-[65vw] max-w-[65vw] sm:max-w-[65vw] min-w-[min(65vw,320px)] h-[90vh] max-h-[100vh] overflow-y-auto overflow-x-hidden">
          
          {selectedDecision && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between min-w-0">
                  <span className="min-w-0 truncate">Decision Details</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        selectedDecision.outcome === "APPROVED" ? "default" :
                        selectedDecision.outcome === "BLOCKED" ? "destructive" :
                        "secondary"
                      }
                    >
                      Status: {selectedDecision.outcome === "REVIEW" ? "Human Review" : selectedDecision.outcome}
                    </Badge>
                    <Badge variant="outline">
                      Outcome: {selectedDecision.review_queue_outcome ?? "—"}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 min-w-0">
                {/* Status & Outcome - always visible */}
                <div className="rounded-lg border bg-muted/30 p-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="font-medium text-base">{selectedDecision.outcome === "REVIEW" ? "Human Review" : selectedDecision.outcome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Decision from validation engine</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Outcome</p>
                    <p className="font-medium text-base">{selectedDecision.review_queue_outcome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Result from review queue (e.g. Approved, Blocked, Pending review)</p>
                  </div>
                </div>

                {/* Metrics: primary Confidence uses outcome confidence when available */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">
                      {((selectedDecision.confidence ?? 0) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedDecision.outcome_confidence != null ? "Outcome confidence (from review)" : "Status confidence"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status confidence</p>
                    <p className="text-xl font-semibold">
                      {((selectedDecision.status_confidence ?? selectedDecision.confidence ?? 0) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">From validation engine</p>
                  </div>
                  {selectedDecision.outcome_confidence != null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Outcome confidence</p>
                      <p className="text-xl font-semibold">
                        {((selectedDecision.outcome_confidence ?? 0) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">From review queue</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold">{selectedDecision.risk_score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agent Attempts</p>
                    <p className="text-2xl font-bold">{selectedDecision.agent_attempts ?? 0}/3</p>
                  </div>
                </div>

                {/* Event Data */}
                <div className="min-w-0">
                  <p className="text-sm font-medium mb-2">Event Data:</p>
                  <pre className="bg-muted/50 rounded-lg p-4 text-xs whitespace-pre-wrap break-all max-w-full">
                    {JSON.stringify(selectedDecision.event_data, null, 2)}
                  </pre>
                </div>

                {/* Reasoning */}
                <div className="min-w-0">
                  <p className="text-sm font-medium mb-2">Agent Reasoning:</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-4 break-words">{selectedDecision.reasoning}</p>
                </div>

                {/* Matched Policies */}
                {selectedDecision.matched_conditions && (
                  <div className="min-w-0">
                    <p className="text-sm font-medium mb-2">Matched Policies:</p>
                    <ul className="space-y-1 break-words">
                      {(typeof selectedDecision.matched_conditions === 'string' 
                        ? JSON.parse(selectedDecision.matched_conditions) 
                        : selectedDecision.matched_conditions
                      ).map((policy: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground break-words">• {policy}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Agent Queries */}
                {selectedDecision.agent_queries_used && selectedDecision.agent_queries_used.length > 0 && (
                  <div className="min-w-0">
                    <p className="text-sm font-medium mb-2">Agent Search Queries:</p>
                    <div className="space-y-2">
                      {selectedDecision.agent_queries_used.map((query: string, i: number) => (
                        <div key={i} className="text-xs bg-muted/30 rounded p-2 font-mono break-words">
                          Attempt {i + 1}: {query.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDecision.requires_human_review && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                      👤 Required Human Review (Low Confidence)
                    </p>
                  </div>
                )}

                {/* Results after review queue */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Results after review queue</p>
                  {selectedDecision.review_queue_outcome ? (
                    <p className="text-sm">
                      <Badge
                        variant={
                          selectedDecision.review_queue_outcome === "Approved" ? "default" :
                          selectedDecision.review_queue_outcome === "Blocked" ? "destructive" :
                          "secondary"
                        }
                        className={
                          selectedDecision.review_queue_outcome === "Pending review" || selectedDecision.review_queue_outcome === "Escalated"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : undefined
                        }
                      >
                        {selectedDecision.review_queue_outcome}
                      </Badge>
                      <span className="text-muted-foreground ml-2">Case was reviewed.</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not reviewed yet.</p>
                  )}
                </div>

                {/* Execution Timeline */}
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Execution Timeline
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground italic">
                    * Simulated execution flow based on decision outcome
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
