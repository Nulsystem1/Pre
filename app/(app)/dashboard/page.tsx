"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertTriangle, Zap, Users } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_decisions: 0,
    approved: 0,
    blocked: 0,
    review: 0,
    pending: 0,
    avg_confidence: 0,
    processing_today: 0,
  })

  useEffect(() => {
    fetch("/api/audit")
      .then((res) => res.json())
      .then((data) => {
        const decisions = data?.data?.decisions || []
        setStats({
          total_decisions: decisions.length,
          approved: decisions.filter((d: any) => d.outcome === "APPROVED").length,
          blocked: decisions.filter((d: any) => d.outcome === "BLOCKED").length,
          review: decisions.filter((d: any) => d.outcome === "REVIEW").length,
          pending: 0,
          avg_confidence: decisions.length > 0
            ? Math.round(decisions.reduce((sum: number, d: any) => sum + (parseFloat(d.confidence) || 0), 0) / decisions.length * 100)
            : 0,
          processing_today: decisions.filter((d: any) => 
            new Date(d.created_at).toDateString() === new Date().toDateString()
          ).length,
        })
      })
  }, [])

  // Sample data for charts
  const decisionTrendData = [
    { date: "Mon", approved: 12, blocked: 3, review: 5 },
    { date: "Tue", approved: 15, blocked: 2, review: 6 },
    { date: "Wed", approved: 18, blocked: 4, review: 3 },
    { date: "Thu", approved: 14, blocked: 1, review: 7 },
    { date: "Fri", approved: 20, blocked: 2, review: 4 },
    { date: "Sat", approved: 8, blocked: 0, review: 2 },
    { date: "Sun", approved: 6, blocked: 1, review: 1 },
  ]

  const outcomeDistribution = [
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Blocked", value: stats.blocked, color: "#ef4444" },
    { name: "Review", value: stats.review, color: "#f59e0b" },
  ]

  const confidenceDistribution = [
    { range: "90-100%", count: Math.floor(stats.total_decisions * 0.4) },
    { range: "80-90%", count: Math.floor(stats.total_decisions * 0.3) },
    { range: "70-80%", count: Math.floor(stats.total_decisions * 0.2) },
    { range: "< 70%", count: Math.floor(stats.total_decisions * 0.1) },
  ]

  const riskScoreData = [
    { hour: "00:00", avgRisk: 25 },
    { hour: "04:00", avgRisk: 30 },
    { hour: "08:00", avgRisk: 45 },
    { hour: "12:00", avgRisk: 52 },
    { hour: "16:00", avgRisk: 38 },
    { hour: "20:00", avgRisk: 28 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Real-time compliance operations overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/command-center">
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Command Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.total_decisions}</div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600 font-medium">+{stats.processing_today}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.total_decisions > 0 ? Math.round((stats.approved / stats.total_decisions) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{stats.blocked}</div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.total_decisions > 0 ? Math.round((stats.blocked / stats.total_decisions) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.avg_confidence}%</div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600 font-medium">+2.5%</span> vs last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decision Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={decisionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="review" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Area type="monotone" dataKey="blocked" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgRisk" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/command-center">
              <Button className="w-full" variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Process Pending ({stats.pending})
              </Button>
            </Link>
            <Link href="/review-queue">
              <Button className="w-full" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review Queue ({stats.review})
              </Button>
            </Link>
            <Link href="/audit-explorer">
              <Button className="w-full" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                View All Decisions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
