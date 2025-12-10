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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Generate execution steps based on decision outcome
const getExecutionSteps = (decision: any) => {
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
        details: `Confidence: ${((parseFloat(decision.confidence) || 0) * 100).toFixed(0)}% (below threshold)`,
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
  const [selectedDecision, setSelectedDecision] = useState<any>(null)

  const { data, isLoading } = useSWR(
    outcomeFilter === "all" ? "/api/audit" : `/api/audit?outcome=${outcomeFilter}`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const decisions = data?.data?.decisions || []

  const stats = {
    total: decisions.length,
    approved: decisions.filter((d: any) => d.outcome === "APPROVED").length,
    blocked: decisions.filter((d: any) => d.outcome === "BLOCKED").length,
    review: decisions.filter((d: any) => d.outcome === "REVIEW").length,
    avgConfidence: decisions.length > 0
      ? (decisions.reduce((sum: number, d: any) => sum + (parseFloat(d.confidence) || 0), 0) / decisions.length).toFixed(2)
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
      <div className="grid gap-4 md:grid-cols-4">
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
                <SelectItem value="REVIEW">Review Only</SelectItem>
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
                  <TableHead>Outcome</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((decision: any) => (
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
                      >
                        {decision.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${(parseFloat(decision.confidence) || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{((parseFloat(decision.confidence) || 0) * 100).toFixed(0)}%</span>
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
                      {decision.agent_attempts}/3
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedDecision && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Decision Details</span>
                  <Badge
                    variant={
                      selectedDecision.outcome === "APPROVED" ? "default" :
                      selectedDecision.outcome === "BLOCKED" ? "destructive" :
                      "secondary"
                    }
                    className="text-lg px-3 py-1"
                  >
                    {selectedDecision.outcome}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Metrics */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">
                      {((parseFloat(selectedDecision.confidence) || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-2xl font-bold">{selectedDecision.risk_score}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agent Attempts</p>
                    <p className="text-2xl font-bold">{selectedDecision.agent_attempts}/3</p>
                  </div>
                </div>

                {/* Event Data */}
                <div>
                  <p className="text-sm font-medium mb-2">Event Data:</p>
                  <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedDecision.event_data, null, 2)}
                  </pre>
                </div>

                {/* Reasoning */}
                <div>
                  <p className="text-sm font-medium mb-2">Agent Reasoning:</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-4">{selectedDecision.reasoning}</p>
                </div>

                {/* Matched Policies */}
                {selectedDecision.matched_conditions && (
                  <div>
                    <p className="text-sm font-medium mb-2">Matched Policies:</p>
                    <ul className="space-y-1">
                      {(typeof selectedDecision.matched_conditions === 'string' 
                        ? JSON.parse(selectedDecision.matched_conditions) 
                        : selectedDecision.matched_conditions
                      ).map((policy: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">• {policy}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Agent Queries */}
                {selectedDecision.agent_queries_used && selectedDecision.agent_queries_used.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Agent Search Queries:</p>
                    <div className="space-y-2">
                      {selectedDecision.agent_queries_used.map((query: string, i: number) => (
                        <div key={i} className="text-xs bg-muted/30 rounded p-2 font-mono">
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

                {/* Execution Timeline */}
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Execution Timeline
                  </p>
                  <div className="space-y-2">
                    {getExecutionSteps(selectedDecision).map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-12 text-muted-foreground font-mono text-xs">
                          {step.delay.toFixed(1)}s
                        </div>
                        <div className="flex-shrink-0 mt-0.5">
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{step.action}</div>
                          {step.details && (
                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                              {step.details}
                            </div>
                          )}
                          {step.status && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {step.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
