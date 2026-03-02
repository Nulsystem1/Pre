"use client"

import { ReviewQueueCasesList } from "@/components/review/review-queue-cases-list"

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground">
          Human review cases from Command Center. Open a case to add attachments (text, PDF, or CSV), generate additional document JSON, and approve, block, or escalate.
        </p>
      </div>

      <ReviewQueueCasesList />
    </div>
  )
}

