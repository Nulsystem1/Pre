"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Sparkles, Upload, Save, Loader2, Search, MessageSquare, FlaskConical } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ControlTester } from "./control-tester"
import type { Control, PolicyPack } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PolicyEditorProps {
  selectedPackId: string | null
}

export function PolicyEditor({ selectedPackId }: PolicyEditorProps) {
  const { data: packData, isLoading: packLoading } = useSWR(
    selectedPackId ? `/api/policy/packs/${selectedPackId}` : null,
    fetcher,
  )

  const [policyText, setPolicyText] = useState("")
  const [isIngesting, setIsIngesting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showTester, setShowTester] = useState(false)

  const pack: PolicyPack | null = packData?.data || null
  const controls: Control[] = packData?.data?.controls || []

  // Update policy text when pack changes
  useEffect(() => {
    if (pack?.raw_content) {
      setPolicyText(pack.raw_content)
    } else {
      setPolicyText("")
    }
    setSearchResult(null)
  }, [pack])

  const handleIngest = async () => {
    if (!selectedPackId || !policyText.trim()) return
    setIsIngesting(true)

    try {
      const response = await fetch("/api/policy/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyPackId: selectedPackId,
          policyText,
        }),
      })

      const result = await response.json()
      if (result.success) {
        mutate(`/api/policy/packs/${selectedPackId}`)
      }
    } catch (err) {
      console.error("Ingestion failed:", err)
    } finally {
      setIsIngesting(false)
    }
  }

  const handleGenerateControls = async () => {
    if (!selectedPackId) return
    setIsGenerating(true)

    try {
      const response = await fetch("/api/controls/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyPackId: selectedPackId }),
      })

      const result = await response.json()
      if (result.success) {
        mutate(`/api/policy/packs/${selectedPackId}`)
      }
    } catch (err) {
      console.error("Control generation failed:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!selectedPackId) return
    setIsPublishing(true)

    try {
      await fetch(`/api/policy/packs/${selectedPackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      })
      mutate(`/api/policy/packs/${selectedPackId}`)
      mutate("/api/policy/packs")
    } catch (err) {
      console.error("Publish failed:", err)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleToggleControl = async (controlId: string, enabled: boolean) => {
    try {
      await fetch("/api/controls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: controlId, enabled }),
      })
      mutate(`/api/policy/packs/${selectedPackId}`)
    } catch (err) {
      console.error("Toggle failed:", err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setSearchResult(null)

    try {
      const response = await fetch("/api/policy/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyPackId: selectedPackId,
          query: searchQuery,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSearchResult(result.data.answer)
      }
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setIsSearching(false)
    }
  }

  if (!selectedPackId) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Select a policy pack to edit</p>
        </CardContent>
      </Card>
    )
  }

  if (packLoading) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Policy Text Editor */}
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">Policy Editor</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Paste your policy document text, then ingest to extract graph entities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 bg-transparent">
              <Upload className="h-4 w-4" />
              Import PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Paste your policy text here, or import from a PDF document..."
            className="min-h-48 resize-none bg-secondary/30 font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleIngest} disabled={isIngesting || !policyText.trim()} variant="outline">
              {isIngesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isIngesting ? "Ingesting..." : "Ingest Policy"}
            </Button>
            <Button onClick={handleGenerateControls} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "Generating..." : "Generate Controls"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RAG Search */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask About This Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., What is the threshold for high-risk customers?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-secondary/30"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} size="icon" variant="outline">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {searchResult && (
            <div className="rounded-lg bg-secondary/30 p-4 text-sm">
              <p className="text-foreground">{searchResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Controls Table */}
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">Generated Controls</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{controls.length} controls from this policy pack</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 bg-transparent"
              onClick={() => setShowTester(!showTester)}
            >
              <FlaskConical className="h-4 w-4" />
              {showTester ? "Hide Tester" : "Test Controls"}
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={handlePublish}
              disabled={isPublishing || controls.length === 0}
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Publish as new version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {controls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No controls generated yet.</p>
              <p className="text-xs mt-1">Ingest a policy and generate controls to see them here.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden lg:table-cell">Condition</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{control.control_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{control.name}</p>
                          {control.ai_reasoning && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{control.ai_reasoning}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                        {control.condition_readable}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            control.action === "BLOCK"
                              ? "bg-destructive/20 text-destructive"
                              : control.action === "REVIEW"
                                ? "bg-warning/20 text-warning"
                                : "bg-primary/20 text-primary"
                          }
                        >
                          {control.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={control.enabled}
                          onCheckedChange={(checked) => handleToggleControl(control.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Tester */}
      {showTester && <ControlTester />}
    </div>
  )
}
