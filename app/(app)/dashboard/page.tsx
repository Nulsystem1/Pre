"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertTriangle, Zap, Users } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data: auditData, isLoading } = useSWR("/api/audit", fetcher, {
    refreshInterval: 5000,
  })
  
  const decisions = auditData?.data?.decisions || []
  
  // Calculate stats from real data
  const stats = {
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
  }

  // Generate trend data from real decisions (last 7 days)
  const getLast7Days = () => {
    const days = []
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: dayNames[date.getDay()],
        fullDate: date.toDateString(),
      })
    }
    return days
  }

  const decisionTrendData = getLast7Days().map((day) => {
    const dayDecisions = decisions.filter((d: any) => 
      new Date(d.created_at).toDateString() === day.fullDate
    )
    return {
      date: day.date,
      approved: dayDecisions.filter((d: any) => d.outcome === "APPROVED").length,
      blocked: dayDecisions.filter((d: any) => d.outcome === "BLOCKED").length,
      review: dayDecisions.filter((d: any) => d.outcome === "REVIEW").length,
    }
  })

  // Confidence distribution from real data
  const confidenceDistribution = [
    { 
      range: "90-100%", 
      count: decisions.filter((d: any) => parseFloat(d.confidence) >= 0.9).length 
    },
    { 
      range: "80-90%", 
      count: decisions.filter((d: any) => parseFloat(d.confidence) >= 0.8 && parseFloat(d.confidence) < 0.9).length 
    },
    { 
      range: "70-80%", 
      count: decisions.filter((d: any) => parseFloat(d.confidence) >= 0.7 && parseFloat(d.confidence) < 0.8).length 
    },
    { 
      range: "< 70%", 
      count: decisions.filter((d: any) => parseFloat(d.confidence) < 0.7).length 
    },
  ]

  // Risk score over time (last 24 hours in 4-hour blocks)
  const getRiskScoreTimeline = () => {
    const timeline = []
    const now = new Date()
    for (let i = 24; i >= 0; i -= 4) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      const startTime = new Date(time.getTime() - 4 * 60 * 60 * 1000)
      const timeDecisions = decisions.filter((d: any) => {
        const decisionTime = new Date(d.created_at)
        return decisionTime >= startTime && decisionTime < time
      })
      const avgRisk = timeDecisions.length > 0
        ? Math.round(timeDecisions.reduce((sum: number, d: any) => sum + (d.risk_score || 0), 0) / timeDecisions.length)
        : 0
      timeline.push({
        hour: time.getHours().toString().padStart(2, '0') + ":00",
        avgRisk,
      })
    }
    return timeline
  }

  const riskScoreData = getRiskScoreTimeline()

  // Sample data for charts
  const outcomeDistribution = [
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Blocked", value: stats.blocked, color: "#ef4444" },
    { name: "Review", value: stats.review, color: "#f59e0b" },
  ].filter(item => item.value > 0) // Only show non-zero values

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
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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
