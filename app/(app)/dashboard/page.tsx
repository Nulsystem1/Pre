import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { DecisionsChart } from "@/components/dashboard/decisions-chart"
import { LatestEvents } from "@/components/dashboard/latest-events"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of your compliance operations</p>
      </div>

      <DashboardMetrics />

      <div className="grid gap-6 lg:grid-cols-2">
        <DecisionsChart />
        <LatestEvents />
      </div>
    </div>
  )
}
