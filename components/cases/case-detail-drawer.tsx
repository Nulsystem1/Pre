"use client"

import type { Case } from "@/app/(app)/cases/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { X, User, MapPin, Briefcase, AlertTriangle, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface CaseDetailDrawerProps {
  caseData: Case | null
  onClose: () => void
}

function getRiskColor(score: number) {
  if (score >= 80) return "text-destructive"
  if (score >= 60) return "text-warning"
  return "text-primary"
}

function getRiskBg(score: number) {
  if (score >= 80) return "bg-destructive/10"
  if (score >= 60) return "bg-warning/10"
  return "bg-primary/10"
}

export function CaseDetailDrawer({ caseData, onClose }: CaseDetailDrawerProps) {
  if (!caseData) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l border-border bg-background shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Case {caseData.id}</h2>
              <p className="text-sm text-muted-foreground">{caseData.primaryReason}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              {/* Customer Summary */}
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Customer Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold",
                        getRiskBg(caseData.riskScore),
                        getRiskColor(caseData.riskScore),
                      )}
                    >
                      {caseData.customer
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{caseData.customer}</h3>
                      <p className="text-sm text-muted-foreground">{caseData.customerId}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {caseData.country}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          {caseData.segment}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Score:{" "}
                          <span className={cn("font-semibold", getRiskColor(caseData.riskScore))}>
                            {caseData.riskScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Event Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {caseData.events.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              event.type === "Alert"
                                ? "bg-warning/20"
                                : event.type === "Decision"
                                  ? event.decision === "Blocked"
                                    ? "bg-destructive/20"
                                    : "bg-primary/20"
                                  : "bg-secondary",
                            )}
                          >
                            {event.type === "Alert" ? (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            ) : event.type === "Decision" ? (
                              event.decision === "Blocked" ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {index < caseData.events.length - 1 && <div className="h-full w-px bg-border" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-foreground">{event.description}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                            {event.decision && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  event.decision === "Blocked"
                                    ? "bg-destructive/20 text-destructive"
                                    : event.decision === "Review"
                                      ? "bg-warning/20 text-warning"
                                      : "bg-chart-2/20 text-chart-2",
                                )}
                              >
                                {event.decision}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Policy Explanation */}
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Policy Explanation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Controls Triggered</p>
                    <div className="flex flex-wrap gap-2">
                      {caseData.controls.map((control) => (
                        <span
                          key={control}
                          className="rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground"
                        >
                          {control}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">AI Explanation</p>
                    <p className="text-sm text-muted-foreground">{caseData.explanation}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Add Note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add a note about this case..."
                    className="min-h-20 resize-none bg-secondary/30"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border px-6 py-4">
            <div className="flex gap-3">
              <Button className="flex-1 gap-2">
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                <MessageSquare className="h-4 w-4" />
                Request Info
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <XCircle className="h-4 w-4" />
                Block
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
