"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, MessageCircle, FileText, Download, Sparkles } from "lucide-react"

type ValidationResult = {
  event_type?: string
  policy_pack_name?: string
  policy_version?: string
  outcome?: string
  decision_type?: string
  risk_score?: number
  confidence?: number
  event_data?: Record<string, unknown>
  explanations?: { bullets: string[] }
  matched_policies?: Array<{ node: string; relationship?: string; target?: string }>
  review?: {
    reasons?: Record<string, string>
    recommended_actions?: unknown[]
    missing_fields?: string[]
  }
}

const OUTCOME_LABELS: Record<string, string> = {
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  BLOCKED: "Blocked",
  ESCALATED: "Escalate",
  NEEDS_INFO: "Request more information",
}

type FileAttachment = {
  file_name: string
  file_type: "pdf" | "txt" | "csv"
  uploaded_by: string
  uploaded_at: string
  extracted_text?: string
}
type LegacyAttachment = {
  type: string
  file_id?: string
  description?: string
  content?: string
  uploaded_by: string
  uploaded_at: string
}
type CaseData = {
  id: string
  case_id: string
  name: string | null
  status: string
  assigned_to: string | null
  validation_result: ValidationResult
  attachments: Array<FileAttachment | LegacyAttachment>
  audit_log: Array<{ timestamp: string; action: string; actor: string }>
  structured_edits: Record<string, unknown>
  policy_pack_id?: string | null
  created_at: string
  updated_at: string
}

function isFileAttachment(a: FileAttachment | LegacyAttachment): a is FileAttachment {
  return "file_name" in a && "file_type" in a
}

export default function ReviewQueueCaseDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [additionalNote, setAdditionalNote] = useState("")
  const [savedNoteContent, setSavedNoteContent] = useState("")
  const [caseName, setCaseName] = useState("")
  const [nameEditing, setNameEditing] = useState(false)

  useEffect(() => {
    if (!id) return
    // Clear attachment text area when opening a (possibly new) case so we never show another case's note
    setAdditionalNote("")
    setSavedNoteContent("")
    fetch(`/api/review-queue/cases/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setCaseData(json.data)
          setCaseName(json.data.name ?? "")
          // Associate textarea with this case: load note from this case's attachments
          const noteAtt = (json.data.attachments ?? []).find(
            (a: LegacyAttachment & { content?: string }) => a.type === "note" && "content" in a
          )
          const content = noteAtt && "content" in noteAtt ? (noteAtt as { content: string }).content : ""
          setAdditionalNote(content)
          setSavedNoteContent(content)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDecisionAction = async (decision_action: string) => {
    if (!id) return
    setActionLoading(decision_action)
    try {
      const res = await fetch(`/api/review-queue/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision_action, actor: "sarah chen" }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setCaseData(json.data)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveName = async () => {
    if (!id) return
    setActionLoading("name")
    try {
      const res = await fetch(`/api/review-queue/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: caseName.trim() || null }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setCaseData(json.data)
        setCaseName(json.data.name ?? "")
        setNameEditing(false)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveNote = async () => {
    if (!id || !caseData) return
    const attachments = [...caseData.attachments]
    const existingNoteIdx = attachments.findIndex(
      (a): a is LegacyAttachment & { type: string } => !isFileAttachment(a) && a.type === "note"
    )
    const noteEntry = {
      type: "note",
      content: additionalNote,
      uploaded_by: "sarah chen",
      uploaded_at: new Date().toISOString(),
    }
    if (existingNoteIdx >= 0) attachments[existingNoteIdx] = noteEntry
    else attachments.push(noteEntry)
    setActionLoading("note")
    try {
      const res = await fetch(`/api/review-queue/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setCaseData(json.data)
        setSavedNoteContent(additionalNote)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const noteHasChanges = additionalNote !== savedNoteContent

  const handleReRunValidation = async () => {
    if (!id || !caseData?.policy_pack_id) return
    setActionLoading("re_run")
    try {
      const vr = caseData.validation_result
      // Gather supplementary text: current note (textarea) or saved note + extracted text from uploaded files — re-evaluation uses this to re-check missing fields and recommended actions and can increase confidence
      const savedNote =
        (caseData.attachments ?? []).find(
          (a: FileAttachment | LegacyAttachment): a is LegacyAttachment & { content?: string } =>
            !isFileAttachment(a) && a.type === "note" && "content" in a
        )?.content ?? ""
      const noteText = (typeof additionalNote === "string" ? additionalNote.trim() : "") || (typeof savedNote === "string" ? savedNote.trim() : "")
      const fileTexts = (caseData.attachments ?? [])
        .filter((a): a is FileAttachment => isFileAttachment(a) && !!a.extracted_text)
        .map((a) => a.extracted_text!.trim())
      const additionalContext = [noteText, ...fileTexts].filter(Boolean).join("\n\n---\n\n")
      const res = await fetch("/api/decisions/evaluate-agentic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: vr.event_type ?? "DOCUMENT_VALIDATION",
          eventData: vr.event_data ?? {},
          policyPackId: caseData.policy_pack_id,
          confidenceThreshold: 0.8,
          ...(additionalContext ? { additionalContext } : {}),
        }),
      })
      const json = await res.json()
      if (!json.success || !json.data) {
        setActionLoading(null)
        return
      }
      const d = json.data
      const bullets = String(d.reasoning ?? "").split(/\n+/).map((s: string) => s.trim()).filter(Boolean)
      if (bullets.length === 0 && d.reasoning) bullets.push(d.reasoning)
      const newVr = {
        event_type: d.event_type,
        policy_pack_name: vr.policy_pack_name,
        policy_version: vr.policy_version,
        validated_at: new Date().toISOString(),
        outcome: d.outcome,
        decision_type: d.confidence >= 0.8 ? "AUTOMATED" : "HUMAN_REVIEW",
        risk_score: d.risk_score,
        confidence: d.confidence,
        event_data: d.event_data,
        explanations: { bullets },
        matched_policies: (d.matched_policies ?? []).map((label: string) => ({ node: label })),
        review: {
          reasons: d.outcome === "REVIEW" ? { REVIEW_REASON: d.reasoning } : d.outcome === "BLOCKED" ? { BLOCK_REASON: d.reasoning } : {},
          policy_implications: [],
          recommended_actions: d.recommended_actions ?? [],
          missing_fields: d.missing_information ?? [],
          ...(d.outcome === "BLOCKED" ? { not_fulfilled: d.missing_information ?? [] } : {}),
        },
      }
      const patchRes = await fetch(`/api/review-queue/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ re_run_validation_result: newVr, actor: "sarah chen" }),
      })
      const patchJson = await patchRes.json()
      if (patchJson.success && patchJson.data) setCaseData(patchJson.data)
    } finally {
      setActionLoading(null)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("uploaded_by", "sarah chen")
      const res = await fetch(`/api/review-queue/cases/${id}/attachments`, {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (json.success && json.data) {
        setCaseData(json.data)
      }
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }

  if (loading || !caseData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const vr = caseData.validation_result
  const isFinalized = caseData.status === "FINALIZED"

  // Effective outcome: from validation_result or from case status/audit
  const auditActions = caseData.audit_log ?? []
  const lastDecision = [...auditActions].reverse().find((e) =>
    ["APPROVE", "BLOCK", "ESCALATE", "REQUEST_MORE_INFO"].includes(e.action)
  )
  const effectiveOutcome =
    caseData.status === "FINALIZED" && lastDecision
      ? lastDecision.action === "APPROVE"
        ? "APPROVED"
        : lastDecision.action === "BLOCK"
          ? "BLOCKED"
          : vr.outcome ?? "IN_REVIEW"
      : caseData.status === "ESCALATED"
        ? "ESCALATED"
        : caseData.status === "NEEDS_INFO"
          ? "NEEDS_INFO"
          : vr.outcome ?? "IN_REVIEW"
  const outcomeLabel = OUTCOME_LABELS[effectiveOutcome] ?? effectiveOutcome

  // Build additional data from review queue: note + file extracts for export
  const getAdditionalData = () => {
    const attachments = caseData?.attachments ?? []
    const noteAtt = attachments.find(
      (a): a is LegacyAttachment & { content?: string } =>
        !isFileAttachment(a) && a.type === "note" && "content" in a
    )
    const additionalNotes = noteAtt?.content?.trim() ?? null
    const fileExtracts = attachments
      .filter((a): a is FileAttachment => isFileAttachment(a) && !!a.extracted_text)
      .map((a) => ({ file_name: a.file_name, file_type: a.file_type, extracted_text: a.extracted_text! }))
    return {
      additional_notes: additionalNotes,
      ...(fileExtracts.length > 0 ? { file_extracts: fileExtracts } : {}),
    }
  }

  const exportPayload = (() => {
    const extra = getAdditionalData()
    const hasExtra = extra.additional_notes != null || (extra as { file_extracts?: unknown[] }).file_extracts?.length
    return hasExtra ? { ...vr, additional_data: extra } : vr
  })()

  const downloadCaseJson = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `decision-${(vr.outcome ?? "case").toLowerCase()}-${caseData.case_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isFinalized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/review-queue">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{caseData.name || caseData.case_id}</h1>
            <span className="text-sm text-muted-foreground font-mono">{caseData.case_id}</span>
            <Badge variant="outline">{caseData.status}</Badge>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Export JSON</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Final decision record. Use for downstream systems and audit.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-[60vh] overflow-y-auto">
              {JSON.stringify(exportPayload, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground">
              This JSON includes outcome (In Review, Approved, Blocked, Escalate, Request more information), decision_type, event_data, explanations.bullets (why), matched_policies, review (recommended_actions, missing_fields), and additional_data (additional_notes from the review queue and file_extracts from uploaded documents). Use it for downstream systems and audit.
            </p>
            <Button className="hover:text-white/80" variant="outline" size="sm" onClick={downloadCaseJson}>
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/review-queue">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          {nameEditing && !isFinalized ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="Case name"
                className="max-w-xs"
              />
              <Button size="sm" onClick={handleSaveName} disabled={actionLoading === "name"}>
                {actionLoading === "name" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setNameEditing(false); setCaseName(caseData.name ?? ""); }}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{caseData.name || caseData.case_id}</h1>
              {caseData.name && <span className="text-sm text-muted-foreground font-mono">{caseData.case_id}</span>}
              {!isFinalized && (
                <Button size="sm" variant="ghost" onClick={() => setNameEditing(true)}>Edit name</Button>
              )}
            </>
          )}
          <Badge
            variant={
              caseData.status === "ESCALATED" ? "destructive" :
              caseData.status === "FINALIZED" ? "outline" : "secondary"
            }
          >
            {caseData.status}
          </Badge>
        </div>
      </div>

      {/* 1. Automated result (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Automated result</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Summary bullets, matched policies, risk, confidence, missing fields, recommended actions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Outcome</Label>
            <p className="text-lg font-semibold">{outcomeLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              In Review · Approved · Blocked · Escalate · Request more information
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Risk score</Label>
              <p className="text-lg font-semibold">{vr.risk_score ?? "—"}/100</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Confidence</Label>
              <p className="text-lg font-semibold">{vr.confidence != null ? `${(vr.confidence * 100).toFixed(0)}%` : "—"}</p>
            </div>
          </div>
          {vr.explanations?.bullets?.length ? (
            <div>
              <Label className="text-muted-foreground">Summary</Label>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {vr.explanations.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {vr.matched_policies?.length ? (
            <div>
              <Label className="text-muted-foreground">Matched policies</Label>
              <ul className="list-disc list-inside text-sm mt-1">
                {vr.matched_policies.map((p, i) => (
                  <li key={i}>{p.node}{p.target ? ` → ${p.target}` : ""}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {vr.review?.missing_fields?.length ? (
            <div>
              <Label className="text-muted-foreground">Missing fields</Label>
              <p className="text-sm mt-1">{vr.review.missing_fields.join(", ")}</p>
            </div>
          ) : null}
          {vr.review?.recommended_actions?.length ? (
            <div>
              <Label className="text-muted-foreground">Recommended actions</Label>
              <ul className="list-disc list-inside text-sm mt-1">
                {(vr.review.recommended_actions as string[]).map((a, i) => (
                  <li key={i}>{typeof a === "string" ? a : JSON.stringify(a)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 2. Attachments: AI auto-fill suggestions + text area + file upload */}
      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Use AI suggestions below, add notes, and upload PDF, TXT, or CSV. Text is extracted and stored with the case. Re-run validation uses this text to re-check missing fields and recommended actions and may increase confidence.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFinalized && (
            <>
              
              <div>
                <Label className="text-muted-foreground">Additional document / notes</Label>
                <Textarea
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  placeholder="Paste or type additional document text, e.g. training hours: 40, salary status: ..."
                  className="mt-1 min-h-[100px] font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 hover:text-white/80"
                  onClick={handleSaveNote}
                  disabled={actionLoading === "note" || !noteHasChanges}
                >
                  {actionLoading === "note" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  {actionLoading === "note" ? "Saving..." : noteHasChanges ? "Save note" : "Saved"}
                </Button>
              </div>
            </>
          )}
          {caseData.attachments.filter((a) => isFileAttachment(a) || (a as LegacyAttachment).type !== "note").length > 0 && (
            <ul className="space-y-2">
              {caseData.attachments
                .filter((a) => isFileAttachment(a) || (a as LegacyAttachment).type !== "note")
                .map((a, i) => (
                  <li key={i} className="rounded-lg border p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {isFileAttachment(a) ? (
                        <>
                          <span className="font-medium">{a.file_name}</span>
                          <Badge variant="secondary" className="uppercase">{a.file_type}</Badge>
                        </>
                      ) : (
                        <span className="font-medium">{a.type}</span>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {a.uploaded_by} · {new Date(a.uploaded_at).toLocaleString()}
                      </span>
                    </div>
                    {isFileAttachment(a) && a.extracted_text ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View extracted text</summary>
                        <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-auto max-h-48 whitespace-pre-wrap">{a.extracted_text}</pre>
                      </details>
                    ) : !isFileAttachment(a) ? (
                      (a as LegacyAttachment).description ? (
                        <p className="text-muted-foreground">{(a as LegacyAttachment).description}</p>
                      ) : null
                    ) : null}
                  </li>
                ))}
            </ul>
          )}
          {!isFinalized && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv"
                onChange={handleUploadAttachment}
                className="hidden"
              />
              <Button
              className="hover:text-white/80"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                Upload PDF, TXT, or CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Decision actions */}
      <Card>
        <CardHeader>
          <CardTitle>Decision actions</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Re-run validation, approve, block, escalate, or request more info. Status flow: Approve/Block → FINALIZED; Escalate → ESCALATED; Request info → NEEDS_INFO.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {!isFinalized && (
            <>
              <Button
              className="hover:text-white/80"
                variant="outline"
                size="sm"
                onClick={handleReRunValidation}
                disabled={!!actionLoading || !caseData.policy_pack_id}
              >
                {actionLoading === "re_run" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Re-run validation
              </Button>
              <Button
              className="hover:text-white/80"
                variant="outline"
                size="sm"
                onClick={() => handleDecisionAction("approve")}
                disabled={!!actionLoading}
              >
                {actionLoading === "approve" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Approve
              </Button>
              <Button
              className="hover:text-white/80"
                variant="destructive"
                size="sm"
                onClick={() => handleDecisionAction("block")}
                disabled={!!actionLoading}
              >
                {actionLoading === "block" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                Block
              </Button>
              <Button
              className="hover:text-white/80"
                variant="outline"
                size="sm"
                onClick={() => handleDecisionAction("escalate")}
                disabled={!!actionLoading}
              >
                {actionLoading === "escalate" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
                Escalate
              </Button>
              
            </>
          )}
          {isFinalized && (
            <p className="text-sm text-muted-foreground">Case is finalized. No further actions.</p>
          )}
        </CardContent>
      </Card>

      {caseData.audit_log?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Timeline of decisions and actions on this case.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                <span>By</span>
                <span className="text-center">Decision</span>
                <span>Timestamp</span>
              </div>
              <ul className="divide-y">
                {caseData.audit_log.map((e, i) => (
                  <li key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 text-sm items-center">
                    <span className="text-muted-foreground">by {e.actor}</span>
                    <span className="font-medium text-center">
                      {e.action === "RE_RUN_VALIDATION"
                        ? "Re-run validation"
                        : e.action === "APPROVE"
                          ? "Approve"
                          : e.action === "BLOCK"
                            ? "Block"
                            : e.action === "ESCALATE"
                              ? "Escalate"
                              : e.action === "REQUEST_MORE_INFO"
                                ? "Request more info"
                                : e.action}
                    </span>
                    <span className="text-muted-foreground font-mono text-right">
                      {new Date(e.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
