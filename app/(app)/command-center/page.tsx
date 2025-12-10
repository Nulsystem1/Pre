"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, Clock, CheckCircle2, XCircle, AlertCircle, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ManualEntryDialog } from "@/components/command-center/manual-entry-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CommandCenterPage() {
  const { data, isLoading } = useSWR("/api/command-center?status=pending", fetcher, {
    refreshInterval: 3000, // Poll every 3s
  })

  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processingAll, setProcessingAll] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState<any>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)

  const pending = data?.data?.pending_decisions || []
  const stats = data?.data?.stats || {}

  const handleProcess = async (id: string) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/command-center/process/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confidenceThreshold: 0.7 }),
      })

      const result = await response.json()
      if (result.success) {
        setSelectedDecision(result.data)
        mutate("/api/command-center?status=pending")
      }
    } catch (err) {
      console.error("Process failed:", err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleProcessAll = async () => {
    setProcessingAll(true)
    try {
      const response = await fetch("/api/command-center/process-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_concurrent: 3, confidence_threshold: 0.7 }),
      })

      const result = await response.json()
      if (result.success) {
        mutate("/api/command-center?status=pending")
        alert(`Processed ${result.data.processed} decisions:\n` +
              `✅ Approved: ${result.data.approved}\n` +
              `🚫 Blocked: ${result.data.blocked}\n` +
              `👤 Sent to Review: ${result.data.sent_to_review}\n` +
              `❌ Failed: ${result.data.failed}`)
      }
    } catch (err) {
      console.error("Process all failed:", err)
    } finally {
      setProcessingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Agentic decision processing queue</p>
        </div>
        <Button onClick={() => setShowManualEntry(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {stats.processing_count > 0 ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Loader2 className="h-4 w-4 text-muted-foreground" />
              )}
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_today || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.high_priority_pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {pending.length} decision{pending.length !== 1 ? "s" : ""} waiting for agent processing
            </div>
            <Button
              onClick={handleProcessAll}
              disabled={processingAll || pending.length === 0}
              size="sm"
            >
              {processingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Process All ({pending.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Decisions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No pending decisions</p>
              <p className="text-xs mt-1">All caught up!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.event_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.priority === "high" ? "destructive" : 
                          item.priority === "medium" ? "default" : 
                          "secondary"
                        }
                      >
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-mono max-w-md truncate">
                      {JSON.stringify(item.event_data).substring(0, 50)}...
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleProcess(item.id)}
                        disabled={processingId === item.id}
                      >
                        {processingId === item.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Process"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Decision Result */}
      {selectedDecision && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Agent Decision</span>
              <Badge
                variant={
                  selectedDecision.decision.outcome === "APPROVED" ? "default" :
                  selectedDecision.decision.outcome === "BLOCKED" ? "destructive" :
                  "secondary"
                }
                className="text-lg px-3 py-1"
              >
                {selectedDecision.decision.outcome}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">
                  {(selectedDecision.decision.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">{selectedDecision.decision.risk_score}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agent Attempts</p>
                <p className="text-2xl font-bold">{selectedDecision.agent_metadata.attempts}/3</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Reasoning:</p>
              <p className="text-sm bg-muted/50 rounded-lg p-4">{selectedDecision.decision.reasoning}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Matched Policies:</p>
              <ul className="space-y-1">
                {selectedDecision.decision.matched_policies.map((policy: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">• {policy}</li>
                ))}
              </ul>
            </div>

            {selectedDecision.decision.requires_human_review && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                  👤 Sent to Review Queue (Low Confidence)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Dialog */}
      <ManualEntryDialog
        open={showManualEntry}
        onOpenChange={setShowManualEntry}
        onSubmit={() => {
          mutate("/api/command-center?status=pending")
        }}
        policyPackId={data?.data?.pending_decisions?.[0]?.policy_pack_id}
      />
    </div>
  )
}
