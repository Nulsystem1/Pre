"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { hour: "00", approved: 120, review: 5, blocked: 2 },
  { hour: "04", approved: 45, review: 2, blocked: 0 },
  { hour: "08", approved: 280, review: 12, blocked: 3 },
  { hour: "12", approved: 420, review: 18, blocked: 5 },
  { hour: "16", approved: 380, review: 15, blocked: 4 },
  { hour: "20", approved: 210, review: 8, blocked: 2 },
]

export function DecisionsMiniChart() {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Decisions last 24 hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Bar dataKey="approved" stackId="a" fill="var(--color-chart-1)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="review" stackId="a" fill="var(--color-chart-3)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="blocked" stackId="a" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
            <span className="text-xs text-muted-foreground">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-3" />
            <span className="text-xs text-muted-foreground">Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-chart-4" />
            <span className="text-xs text-muted-foreground">Blocked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
