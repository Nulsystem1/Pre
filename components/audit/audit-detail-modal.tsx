"use client"

import type { AuditRecord } from "@/app/(app)/audit-explorer/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Copy, Check } from "lucide-react"
import { useState } from "react"

interface AuditDetailModalProps {
  record: AuditRecord | null
  onClose: () => void
}

const decisionStyles = {
  Approved: "bg-primary/20 text-primary",
  Review: "bg-warning/20 text-warning",
  Blocked: "bg-destructive/20 text-destructive",
}

export function AuditDetailModal({ record, onClose }: AuditDetailModalProps) {
  const [copiedEvent, setCopiedEvent] = useState(false)
  const [copiedDecision, setCopiedDecision] = useState(false)

  if (!record) return null

  const copyToClipboard = (data: Record<string, unknown>, type: "event" | "decision") => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    if (type === "event") {
      setCopiedEvent(true)
      setTimeout(() => setCopiedEvent(false), 2000)
    } else {
      setCopiedDecision(true)
      setTimeout(() => setCopiedDecision(false), 2000)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">Audit Record {record.id}</h2>
            <Badge variant="secondary" className={decisionStyles[record.decision]}>
              {record.decision}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-auto p-6">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Time</p>
                <p className="mt-1 font-mono text-foreground">{record.time}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Entity</p>
                <p className="mt-1 text-foreground">{record.entityId}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Control</p>
                <p className="mt-1 font-mono text-foreground">{record.control || "None"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Actor</p>
                <p className="mt-1 text-foreground">
                  {record.actor}
                  {record.actorName && ` (${record.actorName})`}
                </p>
              </div>
            </div>

            {/* Event JSON */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-muted-foreground">Event Data</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => copyToClipboard(record.rawData.event, "event")}
                >
                  {copiedEvent ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedEvent ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="overflow-auto rounded-lg border border-border bg-secondary/30 p-4 font-mono text-xs text-foreground">
                {JSON.stringify(record.rawData.event, null, 2)}
              </pre>
            </div>

            {/* Decision JSON */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase text-muted-foreground">Decision Data</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => copyToClipboard(record.rawData.decision, "decision")}
                >
                  {copiedDecision ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedDecision ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="overflow-auto rounded-lg border border-border bg-secondary/30 p-4 font-mono text-xs text-foreground">
                {JSON.stringify(record.rawData.decision, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
