import { IncomingEvents } from "@/components/live-controls/incoming-events"
import { LiveControlsKpis } from "@/components/live-controls/live-controls-kpis"
import { DecisionsMiniChart } from "@/components/live-controls/decisions-mini-chart"

export default function LiveControlsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Controls</h1>
        <p className="text-muted-foreground">Monitor real-time control execution on incoming events</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomingEvents />
        </div>
        <div className="space-y-6">
          <LiveControlsKpis />
          <DecisionsMiniChart />
        </div>
      </div>
    </div>
  )
}
