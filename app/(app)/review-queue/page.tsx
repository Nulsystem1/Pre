"use client"

import { ReviewQueue } from "@/components/review/review-queue"

export default function ReviewQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground">
          Review and approve items that require human decision
        </p>
      </div>

      <ReviewQueue />
    </div>
  )
}

