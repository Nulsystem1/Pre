import { Users, ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const metrics = [
  {
    label: "Customers monitored",
    value: "124,847",
    change: "+2.3%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    label: "Transactions today",
    value: "8,294",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: ArrowUpRight,
  },
  {
    label: "Auto approvals",
    value: "94.2%",
    change: "+1.1%",
    changeType: "positive" as const,
    icon: CheckCircle,
  },
  {
    label: "Reviews needed",
    value: "23",
    change: "-8.0%",
    changeType: "positive" as const,
    icon: AlertTriangle,
  },
  {
    label: "Cases open",
    value: "47",
    change: "+3",
    changeType: "neutral" as const,
    icon: Briefcase,
  },
]

export function DashboardMetrics() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  metric.changeType === "positive" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {metric.change}
                {metric.changeType === "positive" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
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
