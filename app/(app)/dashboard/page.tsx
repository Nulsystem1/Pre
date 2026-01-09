"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity, TrendingUp, TrendingDown, Clock, CheckCircle2,
  XCircle, AlertTriangle, Zap, ArrowUpRight, BarChart3,
  Search, Filter, Shield, Radar
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardPage() {
  const { data: auditData, isLoading } = useSWR("/api/audit", fetcher, {
    refreshInterval: 5000,
  })

  const decisions = auditData?.data?.decisions || []

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

  // Sample data for charts
  const outcomeDistribution = [
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Blocked", value: stats.blocked, color: "#ef4444" },
    { name: "Review", value: stats.review, color: "#f59e0b" },
  ].filter(item => item.value > 0)

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="p-8 space-y-8 bg-zinc-950 min-h-screen text-white">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 bg-zinc-800" />
          <Skeleton className="h-10 w-32 bg-zinc-800" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl bg-zinc-800" />
          <Skeleton className="h-[350px] rounded-xl bg-zinc-800" />
        </div>
      </div>
    )
  }

  // Get last 5 decisions
  const recentDecisions = [...decisions]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans selection:bg-blue-500/30">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-zinc-900">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Radar className="h-8 w-8 text-blue-500 animate-pulse" />
            Command Center
          </h1>
          <p className="text-zinc-400 mt-2">Real-time operational feedback loop</p>
        </div>
        <div className="flex gap-3">
          <Link href="/command-center">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border-0">
              <Zap className="h-4 w-4 mr-2" />
              Process Items
            </Button>
          </Link>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Volume</CardTitle>
            <Activity className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_decisions}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Decisions processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white hover:border-emerald-500/30 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white">{stats.approved}</div>
            <p className="text-xs text-zinc-500 mt-1">Low risk vendors</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white hover:border-red-500/30 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-400">Blocked</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white">{stats.blocked}</div>
            <p className="text-xs text-zinc-500 mt-1">High risk threats</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white hover:border-purple-500/30 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-400">Avg Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{stats.avg_confidence}%</div>
            <p className="text-xs text-zinc-500 mt-1">AI Certainty Score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

        {/* MAIN CHARTS AREA */}
        <Card className="col-span-4 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Decision Velocity</CardTitle>
            <CardDescription className="text-zinc-500">7-Day Volume Breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={decisionTrendData}>
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} stroke="#71717a" />
                <YAxis tickLine={false} axisLine={false} stroke="#71717a" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    color: '#fff',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlocked)" strokeWidth={2} />
                <Area type="monotone" dataKey="review" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RECENT ACTIVITY & PIE CHART */}
        <div className="col-span-3 grid gap-6">
          {/* Recent Activity List */}
          <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" /> Live Feed
                </CardTitle>
                <Link href="/audit-explorer" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center">
                  View All <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {recentDecisions.length > 0 ? (
                  recentDecisions.map((decision: any) => (
                    <div key={decision.id} className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0 last:pb-0 group hover:bg-zinc-800/50 p-2 rounded transition-colors -mx-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${decision.outcome === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            decision.outcome === 'BLOCKED' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                              'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                          {decision.outcome === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> :
                            decision.outcome === 'BLOCKED' ? <XCircle className="h-4 w-4" /> :
                              <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div className="grid gap-0.5">
                          <p className="text-sm font-medium leading-none text-zinc-200">{decision.event?.payload?.vendor_name || "Unknown Vendor"}</p>
                          <p className="text-xs text-zinc-500">{new Date(decision.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`border-0 ${decision.outcome === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                          decision.outcome === 'BLOCKED' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                        }`}>
                        {(decision.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-zinc-600 flex flex-col items-center">
                    <Shield className="h-8 w-8 mb-2 opacity-20" />
                    <span className="text-sm">No recent activity</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Small Distribution Chart */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-0">
              <CardTitle className="text-base text-white">Outcomes</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {outcomeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      color: '#fff',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
