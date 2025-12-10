import { FileText, ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle, Gauge } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const metrics = [
  {
    label: "Policy Documents",
    value: "0",
    change: "+0",
    changeType: "neutral" as const,
    icon: FileText,
  },
  {
    label: "Active Rules",
    value: "0",
    change: "+0",
    changeType: "neutral" as const,
    icon: Gauge,
  },
  {
    label: "Auto-Execute Rate",
    value: "0%",
    change: "+0%",
    changeType: "neutral" as const,
    icon: CheckCircle,
  },
  {
    label: "Pending Reviews",
    value: "0",
    change: "+0",
    changeType: "neutral" as const,
    icon: AlertTriangle,
  },
]

export function DashboardMetrics() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  metric.changeType === "positive" ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {metric.change}
                {metric.changeType === "positive" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : metric.changeType === "neutral" ? null : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
