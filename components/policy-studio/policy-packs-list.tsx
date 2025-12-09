"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, FileCode2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PolicyPack } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PolicyPacksListProps {
  selectedPackId: string | null
  onSelectPack: (packId: string) => void
}

export function PolicyPacksList({ selectedPackId, onSelectPack }: PolicyPacksListProps) {
  const { data, error, isLoading } = useSWR("/api/policy/packs", fetcher, {
    refreshInterval: 5000,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [newPackName, setNewPackName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const policyPacks: (PolicyPack & { controls_count: number })[] = data?.data || []

  // Auto-select first pack on load
  useEffect(() => {
    if (!selectedPackId && policyPacks.length > 0) {
      onSelectPack(policyPacks[0].id)
    }
  }, [policyPacks, selectedPackId, onSelectPack])

  const handleCreatePack = async () => {
    if (!newPackName.trim()) return
    setIsCreating(true)

    try {
      await fetch("/api/policy/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPackName }),
      })
      mutate("/api/policy/packs")
      setNewPackName("")
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to create pack:", err)
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/20 text-primary border-0">Active</Badge>
      case "review":
        return <Badge className="bg-warning/20 text-warning border-0">Review</Badge>
      case "archived":
        return <Badge className="bg-muted text-muted-foreground border-0">Archived</Badge>
      default:
        return <Badge variant="secondary">Draft</Badge>
    }
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Not published"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    return "Just now"
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Policy Packs</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 bg-transparent">
              <Plus className="h-4 w-4" />
              New Pack
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Policy Pack</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Pack name (e.g., KYC Pack)"
                value={newPackName}
                onChange={(e) => setNewPackName(e.target.value)}
              />
              <Button onClick={handleCreatePack} disabled={isCreating || !newPackName.trim()} className="w-full">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Pack
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load packs</p>
        ) : policyPacks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No policy packs yet. Create one to get started.
          </p>
        ) : (
          policyPacks.map((pack) => (
            <button
              key={pack.id}
              onClick={() => onSelectPack(pack.id)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                selectedPackId === pack.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:border-primary/50",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {pack.name} v{pack.version}
                  </span>
                </div>
                {getStatusBadge(pack.status)}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{pack.controls_count} controls</span>
                <span>•</span>
                <span>Updated {formatTimeAgo(pack.published_at || pack.created_at)}</span>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
