"use client"

import { AuditTimeline } from "@/components/audit/audit-timeline"

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Complete audit trail of all system events and actions
        </p>
      </div>

      <AuditTimeline />
    </div>
  )
}

