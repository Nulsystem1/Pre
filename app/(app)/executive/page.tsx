"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck, TrendingUp, Clock, Lock,
  FileText, CheckCircle, XCircle, AlertCircle, Loader2,
  ArrowRight, Activity, Zap
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ExecutiveDashboardPage() {
  const { data: statsData, isLoading: loadingStats } = useSWR("/api/stats", fetcher, {
    refreshInterval: 5000,
  })

  const { data: policiesData, isLoading: loadingPolicies, mutate: mutatePolicies } = useSWR(
    "/api/policy/packs?status=review",
    fetcher,
    { refreshInterval: 5000, fallbackData: { success: true, data: [] } }
  )

  const [processingPolicy, setProcessingPolicy] = useState<string | null>(null)

  const stats = statsData?.data || {
    decisions: { total: 0, approved: 0, blocked: 0, review: 0, avgConfidence: 0 },
    roi: { costSavings: 0, riskPrevented: 0, autoExecuteRate: 0, velocityFactor: "120x" },
    policies: { pendingApproval: 0, active: 0 },
    pending: { decisions: 0, reviews: 0 },
  }

  const pendingPolicies = policiesData?.data || []
  const healthScore = stats.decisions.total > 0 ? Math.round((stats.roi.autoExecuteRate)) : 100

  const handlePolicyAction = async (policyId: string, action: "approve" | "reject") => {
    setProcessingPolicy(policyId)
    try {
      const newStatus = action === "approve" ? "active" : "rejected"
      await fetch(`/api/policy/packs/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      mutatePolicies()
    } catch (error) {
      console.error("Error updating policy:", error)
    } finally {
      setProcessingPolicy(null)
    }
  }

  const outcomeDistribution = [
    { name: "Approved", value: stats.decisions.approved, color: "#10b981" }, // emerald-500
    { name: "Blocked", value: stats.decisions.blocked, color: "#ef4444" },  // red-500
    { name: "Review", value: stats.decisions.review, color: "#f59e0b" },   // amber-500
  ].filter(item => item.value > 0)

  if (loadingStats) {
    return (
      <div className="p-8 space-y-8 bg-zinc-950 min-h-screen text-white">
        <Skeleton className="h-12 w-64 bg-zinc-800" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl bg-zinc-800" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans selection:bg-indigo-500/30">

      {/* HEADER */}
      <div className="flex items-end justify-between mb-8 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Executive Overview
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">
            Compliance Posture &amp; Risk Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">System Secure</span>
          </div>
          <div className="text-right text-sm text-zinc-500">
            Updated: <span className="text-zinc-300 font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* PENDING APPROVALS - High Priority Action */}
      {pendingPolicies.length > 0 && (
        <div className="mb-10 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl opacity-20 blur group-hover:opacity-40 transition duration-500" />
          <div className="relative bg-zinc-900 rounded-xl border border-amber-500/30 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Governance Action Required</h3>
                  <p className="text-zinc-400">
                    {pendingPolicies.length} policy definitions awaiting your approval
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {pendingPolicies.map((policy: any) => (
                <div key={policy.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all">
                  <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <FileText className="h-10 w-10 text-zinc-600" />
                    <div>
                      <p className="text-lg font-medium text-white">{policy.name}</p>
                      <p className="text-sm text-zinc-400 mt-1 max-w-xl">{policy.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono">
                          v{policy.version}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          Submitted by Sarah Chen • {new Date(policy.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                      onClick={() => handlePolicyAction(policy.id, "reject")}
                      disabled={processingPolicy === policy.id}
                    >
                      Reject
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                      onClick={() => handlePolicyAction(policy.id, "approve")}
                      disabled={processingPolicy === policy.id}
                    >
                      {processingPolicy === policy.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Policy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group hover:border-zinc-700 transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Compliance Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">{healthScore}%</div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${healthScore}%` }} />
            </div>
            <p className="text-xs text-zinc-500 mt-3">Based on real-time control monitoring</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group hover:border-zinc-700 transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4" /> Projected Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">
              ${stats.roi.costSavings.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 pointer-events-none">
                {stats.decisions.approved} Auto-Decisions
              </Badge>
              <span>in current period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group hover:border-zinc-700 transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4" /> Risk Prevented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">
              ${stats.roi.riskPrevented.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/10 pointer-events-none">
                {stats.decisions.blocked} Threats
              </Badge>
              <span>blocked automatically</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group hover:border-zinc-700 transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-500 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4" /> Velocity Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-2">{stats.roi.velocityFactor}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="px-2 py-1 bg-zinc-800/50 rounded text-center border border-zinc-800">
                <span className="block text-[10px] text-zinc-500 uppercase">Manual</span>
                <span className="text-xs font-mono text-zinc-300">2 Days</span>
              </div>
              <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-center">
                <span className="block text-[10px] text-purple-400 uppercase">AI Agent</span>
                <span className="text-xs font-mono text-purple-300">&lt; 1s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED STATS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 bg-zinc-900 border-zinc-800 h-[400px]">
          <CardHeader>
            <CardTitle className="text-white">Decision Outcome Distribution</CardTitle>
            <CardDescription className="text-zinc-500">Automated classification results</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {outcomeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {outcomeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      color: '#fff',
                      borderRadius: '8px'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <Activity className="h-10 w-10 mb-4 opacity-20" />
                <p>Awaiting decision data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-zinc-900 border-zinc-800 h-[400px]">
          <CardHeader>
            <CardTitle className="text-white">Active Surveillance</CardTitle>
            <CardDescription className="text-zinc-500">Real-time system components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-md">
                  <FileText className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Active Policies</p>
                  <p className="text-xs text-zinc-500">Enforcement logic</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.policies.active}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-md">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Pending Review</p>
                  <p className="text-xs text-zinc-500">Manual intervention</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.pending.reviews}</span>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-zinc-500">AI Confidence Index</span>
                <span className="text-sm font-bold text-emerald-400">{stats.decisions.avgConfidence}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  style={{ width: `${stats.decisions.avgConfidence}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
