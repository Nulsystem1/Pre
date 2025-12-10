"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExecutionMappings } from "@/components/documents/execution-mappings"
import { Loader2, FileText, ArrowLeft } from "lucide-react"
import type { PolicyPack, Control } from "@/lib/types"
import Link from "next/link"

export default function DocumentDetailPage() {
  const params = useParams()
  const id = params.id as string
  
  const [document, setDocument] = useState<PolicyPack | null>(null)
  const [controls, setControls] = useState<Control[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocument()
  }, [id])

  const loadDocument = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/policy/packs/${id}`)
      const { data } = await res.json()
      setDocument(data)
      setControls(data?.controls || [])
    } catch (error) {
      console.error("Error loading document:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{document.name}</h1>
            <Badge
              variant={
                document.status === "active"
                  ? "default"
                  : document.status === "draft"
                  ? "secondary"
                  : "outline"
              }
            >
              {document.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Version {document.version}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Decision Rules ({controls.length})</TabsTrigger>
          <TabsTrigger value="execution">Execution Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{document.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">{document.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      document.status === "active"
                        ? "default"
                        : document.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {document.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(document.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {document.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{document.description}</p>
                </div>
              )}

              {document.raw_content && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Raw Policy Text</p>
                  <div className="bg-slate-50 rounded-md p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{document.raw_content}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Decision Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {controls.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No rules extracted yet
                </p>
              ) : (
                <div className="space-y-4">
                  {controls.map((control) => (
                    <Card key={control.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{control.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {control.control_id}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {control.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              control.action === "BLOCK"
                                ? "destructive"
                                : control.action === "REVIEW"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {control.action}
                          </Badge>
                        </div>
                        <div className="bg-slate-50 rounded p-2 mb-2">
                          <p className="text-xs font-mono">{control.condition_readable}</p>
                        </div>
                        {control.ai_reasoning && (
                          <p className="text-xs text-muted-foreground italic">
                            {control.ai_reasoning}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution">
          <ExecutionMappings policyPackId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

