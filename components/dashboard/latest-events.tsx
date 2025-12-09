import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const events = [
  {
    id: "EVT-8294",
    type: "Transaction",
    entity: "TXN-482910",
    amount: "$12,450.00",
    decision: "Approved",
    control: null,
    time: "2 min ago",
  },
  {
    id: "EVT-8293",
    type: "Customer",
    entity: "Marcus Thompson",
    amount: null,
    decision: "Review",
    control: "PEP-Screen-001",
    time: "5 min ago",
  },
  {
    id: "EVT-8292",
    type: "Transaction",
    entity: "TXN-482909",
    amount: "$89,200.00",
    decision: "Blocked",
    control: "TXN-Velocity-003",
    time: "8 min ago",
  },
  {
    id: "EVT-8291",
    type: "Customer",
    entity: "Elena Rodriguez",
    amount: null,
    decision: "Approved",
    control: null,
    time: "12 min ago",
  },
  {
    id: "EVT-8290",
    type: "Transaction",
    entity: "TXN-482908",
    amount: "$3,200.00",
    decision: "Approved",
    control: null,
    time: "15 min ago",
  },
]

const decisionStyles = {
  Approved: "bg-primary/20 text-primary",
  Review: "bg-warning/20 text-warning",
  Blocked: "bg-destructive/20 text-destructive",
}

export function LatestEvents() {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Latest events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{event.entity}</span>
                  <span className="text-xs text-muted-foreground">
                    {event.type}
                    {event.amount && ` • ${event.amount}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.control && (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {event.control}
                  </span>
                )}
                <Badge variant="secondary" className={decisionStyles[event.decision as keyof typeof decisionStyles]}>
                  {event.decision}
                </Badge>
                <span className="text-xs text-muted-foreground">{event.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
