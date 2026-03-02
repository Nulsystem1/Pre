"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, Search, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DocumentUpload } from "@/components/policy-studio/document-upload"
import type { PolicyPack } from "@/lib/types"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const pack: PolicyPack | null = packData?.data || null

  useEffect(() => {
    setPolicyText(pack?.raw_content ?? "")
  }, [selectedPackId, pack?.raw_content ?? ""])

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)

    try {
      const response = await fetch("/api/policy/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          policyPackId: selectedPackId,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Policy Document</span>
            <Button
              size="sm"
              onClick={handleIngest}
              disabled={!policyText.trim() || isIngesting}
            >
              {isIngesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Building Graph...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ingest & Build Graph
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocumentUpload
            onTextExtracted={setPolicyText}
            disabled={isIngesting}
          />
          <Textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Paste your policy document here or upload a .txt / .pdf above, then click 'Ingest & Build Graph'..."
            className="min-h-[300px] max-h-[500px] font-mono text-sm resize-y"
          />
          {pack && (
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Linear RAG:</span>
                <span className="font-medium">{pack.chunks_count || 0} chunks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Graph RAG:</span>
                <span className="font-medium">{pack.graph_nodes_count || 0} nodes, {pack.graph_edges_count || 0} edges</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      
    </div>
  )
}