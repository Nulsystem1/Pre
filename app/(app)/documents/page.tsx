"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IngestWizard } from "@/components/documents/ingest-wizard"
import { Plus, FileText, Loader2 } from "lucide-react"
import type { PolicyPack } from "@/lib/types"
import Link from "next/link"

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<PolicyPack[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/policy/packs")
      const { data } = await res.json()
      setDocuments(data || [])
    } catch (error) {
      console.error("Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWizardComplete = () => {
    loadDocuments()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Documents</h1>
          <p className="text-muted-foreground">
            Manage compliance policy documents and their extracted rules
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ingest New Document
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by ingesting your first policy document
            </p>
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ingest Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="hover:border-blue-500 transition-colors cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <Badge
                      variant={
                        doc.status === "active"
                          ? "default"
                          : doc.status === "draft"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Version {doc.version}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Created {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <IngestWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
      />
    </div>
  )
}

