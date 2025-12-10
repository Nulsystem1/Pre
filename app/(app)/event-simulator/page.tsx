"use client"

import { EventSimulator } from "@/components/events/event-simulator"

export default function EventSimulatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Simulator</h1>
        <p className="text-muted-foreground">
          Test policy controls by simulating vendor onboarding events
        </p>
      </div>

      <EventSimulator />
    </div>
  )
}

