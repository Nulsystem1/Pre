"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, FileCode2, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PolicyPack } from "@/lib/types"

type PackWithCount = PolicyPack & { controls_count: number }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PolicyPacksListProps {
  selectedPackId: string | null
  onSelectPack: (packId: string | null) => void
}

export function PolicyPacksList({ selectedPackId, onSelectPack }: PolicyPacksListProps) {
  const { data, error, isLoading } = useSWR("/api/policy/packs", fetcher, {
    refreshInterval: 5000,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [newPackName, setNewPackName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const policyPacks: PackWithCount[] = data?.data || []

  const [renamePack, setRenamePack] = useState<PackWithCount | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [deletePack, setDeletePack] = useState<PackWithCount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleRename = async () => {
    if (!renamePack || !renameValue.trim()) return
    setIsRenaming(true)
    try {
      const res = await fetch(`/api/policy/packs/${renamePack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      })
      if (res.ok) {
        mutate("/api/policy/packs")
        mutate(`/api/policy/packs/${renamePack.id}`)
        setRenamePack(null)
        setRenameValue("")
      }
    } catch (err) {
      console.error("Failed to rename pack:", err)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async () => {
    if (!deletePack) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/policy/packs/${deletePack.id}`, { method: "DELETE" })
      if (res.ok) {
        mutate("/api/policy/packs")
        if (selectedPackId === deletePack.id) {
          const remaining = policyPacks.filter((p) => p.id !== deletePack.id)
          onSelectPack(remaining[0]?.id ?? null)
        }
        setDeletePack(null)
      }
    } catch (err) {
      console.error("Failed to delete pack:", err)
    } finally {
      setIsDeleting(false)
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
            <Button size="sm" variant="outline" className="gap-1 bg-transparent hover:text-white/50">
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
            <div
              onClick={() => onSelectPack(pack.id)}
              key={pack.id}
              className={cn(
                "flex items-start gap-1 rounded-lg border p-3 transition-colors",
                selectedPackId === pack.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:border-primary/50",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectPack(pack.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground truncate">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setRenamePack(pack)
                      setRenameValue(pack.name)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault()
                      setDeletePack(pack)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}

        {/* Rename dialog */}
        <Dialog open={!!renamePack} onOpenChange={(open) => !open && setRenamePack(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename policy pack</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Pack name"
              />
              <Button onClick={handleRename} disabled={isRenaming || !renameValue.trim()} className="w-full">
                {isRenaming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={!!deletePack} onOpenChange={(open) => !open && setDeletePack(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete policy pack?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete &quot;{deletePack?.name}&quot; and all its controls, chunks, and
              knowledge graph. All review queue cases linked to this pack will also be deleted.
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDeletePack(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
