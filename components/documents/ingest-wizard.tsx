"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { DocumentUpload } from "@/components/policy-studio/document-upload"

type Step = "details" | "text" | "extracting" | "review" | "complete"

interface IngestWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function IngestWizard({ open, onOpenChange, onComplete }: IngestWizardProps) {
  const [step, setStep] = useState<Step>("details")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [name, setName] = useState("")
  const [version, setVersion] = useState("1.0")
  const [description, setDescription] = useState("")
  const [domain, setDomain] = useState<string>("")
  const [policyText, setPolicyText] = useState("")
  
  // Extraction results
  const [policyPackId, setPolicyPackId] = useState<string | null>(null)
  const [chunksCreated, setChunksCreated] = useState(0)
  const [nodesCreated, setNodesCreated] = useState(0)
  const [controlsGenerated, setControlsGenerated] = useState(0)

  const resetForm = () => {
    setStep("details")
    setName("")
    setVersion("1.0")
    setDescription("")
    setDomain("")
    setPolicyText("")
    setPolicyPackId(null)
    setChunksCreated(0)
    setNodesCreated(0)
    setControlsGenerated(0)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleNextFromDetails = () => {
    if (!name || !version || !domain) {
      setError("Please fill in all required fields")
      return
    }
    setError(null)
    setStep("text")
  }

  const handleIngest = async () => {
    if (!policyText.trim()) {
      setError("Please enter policy text")
      return
    }
    
    setError(null)
    setLoading(true)
    setStep("extracting")
    
    try {
      // Step 1: Create policy pack
      const packRes = await fetch("/api/policy/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          version,
          description,
          status: "draft",
        }),
      })
      
      if (!packRes.ok) throw new Error("Failed to create policy pack")
      const { data: pack } = await packRes.json()
      setPolicyPackId(pack.id)
      
      // Step 2: Ingest policy text
      const ingestRes = await fetch("/api/policy/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyPackId: pack.id,
          policyText,
        }),
      })
      
      if (!ingestRes.ok) throw new Error("Failed to ingest policy")
      const { data: ingestResult } = await ingestRes.json()
      
      setChunksCreated(ingestResult.chunks_created)
      setNodesCreated(ingestResult.graph_nodes_created)
      
      // Step 3: Generate controls
      const controlsRes = await fetch("/api/controls/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyPackId: pack.id,
        }),
      })
      
      if (!controlsRes.ok) throw new Error("Failed to generate controls")
      const { data: controlsResult } = await controlsRes.json()
      
      setControlsGenerated(controlsResult.controls.length)
      
      // Create audit event
      await fetch("/api/audit-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "DOCUMENT_INGESTED",
          description: `Ingested policy document: ${name} v${version}`,
          actor: "system",
          document_id: pack.id,
          metadata: {
            chunks_created: ingestResult.chunks_created,
            nodes_created: ingestResult.graph_nodes_created,
            controls_generated: controlsResult.controls.length,
          },
        }),
      })
      
      setStep("complete")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setStep("text")
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    if (onComplete) onComplete()
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "details" && "Document Details"}
            {step === "text" && "Enter Policy Text"}
            {step === "extracting" && "Extracting Policy Rules"}
            {step === "complete" && "Ingestion Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "details" && "Provide information about the policy document"}
            {step === "text" && "Paste or type the policy document text"}
            {step === "extracting" && "AI is extracting rules and generating controls..."}
            {step === "complete" && "Policy document has been successfully ingested"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Details */}
        {step === "details" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Vendor Onboarding Policy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Finance">Finance & Procurement</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                  <SelectItem value="Security">Security & Privacy</SelectItem>
                  <SelectItem value="IT">IT & Systems</SelectItem>
                  <SelectItem value="Legal">Legal & Compliance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this policy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Policy Text */}
        {step === "text" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Policy Document Text *</Label>
              <DocumentUpload
                onTextExtracted={setPolicyText}
                disabled={loading}
              />
              <Textarea
                id="policyText"
                placeholder="Or paste your policy document here..."
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Upload a .txt or .pdf file, or paste the full text. The AI will extract rules and generate controls.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Extracting */}
        {step === "extracting" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground text-center">
              AI is analyzing the policy document, extracting rules,<br />
              building knowledge graph, and generating executable controls...
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>

            <div className="space-y-3 bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Policy Chunks Created:</span>
                <span className="font-semibold">{chunksCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Graph Nodes Created:</span>
                <span className="font-semibold">{nodesCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Controls Generated:</span>
                <span className="font-semibold">{controlsGenerated}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              You can now view and configure the extracted rules in the Document Detail page.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "details" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNextFromDetails}>
                Next
              </Button>
            </>
          )}

          {step === "text" && (
            <>
              <Button variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button onClick={handleIngest} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  "Ingest Document"
                )}
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleFinish}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

