import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

const kpis = [
  {
    label: "Auto approved today",
    value: "2,847",
    icon: CheckCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Under review",
    value: "23",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    label: "Blocked",
    value: "8",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
]

export function LiveControlsKpis() {
  return (
    <div className="space-y-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${kpi.bgColor}`}>
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
