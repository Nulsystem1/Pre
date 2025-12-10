"use client"

import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { DecisionsChart } from "@/components/dashboard/decisions-chart"
import { LatestEvents } from "@/components/dashboard/latest-events"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Play, CheckSquare, FileSearch } from "lucide-react"
import { useState } from "react"
import { IngestWizard } from "@/components/documents/ingest-wizard"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to NUL Compliance Control Center</p>
      </div>

      <DashboardMetrics />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4"
            onClick={() => setWizardOpen(true)}
          >
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold">Ingest Document</p>
              <p className="text-xs text-muted-foreground">Add new policy</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4"
            onClick={() => router.push("/event-simulator")}
          >
            <Play className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <p className="font-semibold">Simulate Event</p>
              <p className="text-xs text-muted-foreground">Test controls</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4"
            onClick={() => router.push("/review-queue")}
          >
            <CheckSquare className="h-5 w-5 text-orange-600" />
            <div className="text-left">
              <p className="font-semibold">Review Queue</p>
              <p className="text-xs text-muted-foreground">Pending items</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4"
            onClick={() => router.push("/audit-log")}
          >
            <FileSearch className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="font-semibold">Audit Log</p>
              <p className="text-xs text-muted-foreground">View timeline</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <DecisionsChart />
        <LatestEvents />
      </div>

      <IngestWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}
