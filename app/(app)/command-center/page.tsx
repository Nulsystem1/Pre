"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import type { DecisionOutcome, DecisionType, CommandCenterDecisionResult } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, AlertCircle, ShieldAlert, Download, CheckCircle2, FolderOpen, List, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STORAGE_KEY = "command_center_state"
const CONFIDENCE_THRESHOLD = 0.8

/** Export JSON shape: explanations and matched_policies inside JSON; review varies by outcome */
type DecisionExportJson = {
  event_type: string
  policy_pack_name: string
  policy_version: string
  validated_at: string
  outcome: DecisionOutcome
  decision_type: DecisionType
  risk_score: number
  confidence: number
  event_data: Record<string, unknown>
  explanations: { bullets: string[] }
  matched_policies: Array<{ node: string; relationship?: string; target?: string }>
  review: {
    reasons: Record<string, string>
    policy_implications: string[]
    recommended_actions: Array<string | { action: string; because: string; evidence: string }>
    missing_fields: string[]
    not_fulfilled?: string[]
  }
}

function buildDecisionExportJson(r: CommandCenterDecisionResult): DecisionExportJson {
  const decisionType: DecisionType =
    r.confidence >= CONFIDENCE_THRESHOLD ? "AUTOMATED" : "HUMAN_REVIEW"

  const bullets = r.reasoning
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (bullets.length === 0 && r.reasoning.trim()) bullets.push(r.reasoning.trim())

  const matchedPolicies = (r.matched_policies ?? []).map((label) => ({ node: label }))

  const missingFields = r.missing_information ?? []
  const recommendedActions = r.recommended_actions ?? []

  if (r.outcome === "APPROVED") {
    return {
      event_type: r.event_type,
      policy_pack_name: r.policy_pack_name,
      policy_version: r.policy_version,
      validated_at: r.validated_at,
      outcome: r.outcome,
      decision_type: decisionType,
      risk_score: r.risk_score,
      confidence: r.confidence,
      event_data: r.event_data,
      explanations: { bullets },
      matched_policies: matchedPolicies,
      review: {
        reasons: {},
        policy_implications: [],
        recommended_actions: [],
        missing_fields: [],
      },
    }
  }

  if (r.outcome === "BLOCKED") {
    const reasons: Record<string, string> = {}
    if (r.reasoning.trim()) reasons.BLOCK_REASON = r.reasoning.trim()
    const reviewRecommendedActions = recommendedActions.map((action) => ({
      action,
      because: r.reasoning.trim() || "Policy requirement not met.",
      evidence: "policy",
    }))
    return {
      event_type: r.event_type,
      policy_pack_name: r.policy_pack_name,
      policy_version: r.policy_version,
      validated_at: r.validated_at,
      outcome: r.outcome,
      decision_type: decisionType,
      risk_score: r.risk_score,
      confidence: r.confidence,
      event_data: r.event_data,
      explanations: { bullets },
      matched_policies: matchedPolicies,
      review: {
        reasons,
        policy_implications: [],
        recommended_actions: reviewRecommendedActions,
        missing_fields: [],
        not_fulfilled: missingFields,
      },
    }
  }

  // REVIEW
  const reviewReasons: Record<string, string> = {}
  if (r.reasoning.trim()) reviewReasons.REVIEW_REASON = r.reasoning.trim()
  missingFields.forEach((m, i) => {
    reviewReasons[`MISSING_${i + 1}`] = m
  })
  return {
    event_type: r.event_type,
    policy_pack_name: r.policy_pack_name,
    policy_version: r.policy_version,
    validated_at: r.validated_at,
    outcome: r.outcome,
    decision_type: decisionType,
    risk_score: r.risk_score,
    confidence: r.confidence,
    event_data: r.event_data,
    explanations: { bullets },
    matched_policies: matchedPolicies,
    review: {
      reasons: reviewReasons,
      policy_implications: [],
      recommended_actions: recommendedActions,
      missing_fields: missingFields,
    },
  }
}

type PackInput = {
  pastedText: string
  uploadedEvents: Array<{ event_type: string; event_data: Record<string, unknown>; priority?: string }> | null
}

type StoredState = {
  packInputs: Record<string, PackInput>
  results: CommandCenterDecisionResult[]
  policyPackId: string
}

function loadState(): Partial<StoredState> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<StoredState> & {
      pastedText?: string
      uploadedEvents?: PackInput["uploadedEvents"]
    }
    // Migrate old flat state to per-pack
    if (parsed.packInputs == null && (parsed.pastedText != null || parsed.uploadedEvents != null)) {
      const packId = parsed.policyPackId || ""
      return {
        packInputs: packId ? { [packId]: { pastedText: parsed.pastedText ?? "", uploadedEvents: parsed.uploadedEvents ?? null } } : {},
        results: parsed.results ?? [],
        policyPackId: packId,
      }
    }
    return parsed
  } catch {
    return {}
  }
}

function saveState(state: Partial<StoredState>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export default function CommandCenterPage() {
  const router = useRouter()
  const { data: packsData } = useSWR("/api/policy/packs", fetcher)
  const packs = packsData?.data ?? []

  const [policyPackId, setPolicyPackId] = useState<string>("")
  const [pastedText, setPastedText] = useState("")
  const [uploadedEvents, setUploadedEvents] = useState<Array<{ event_type: string; event_data: Record<string, unknown>; priority?: string }> | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [results, setResults] = useState<CommandCenterDecisionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailResult, setDetailResult] = useState<CommandCenterDecisionResult | null>(null)
  const [creatingCaseId, setCreatingCaseId] = useState<string | null>(null)
  const [deletingResultId, setDeletingResultId] = useState<string | null>(null)
  /** Map command_center_result_id (result id) -> case row id for navigation */
  const [resultToCaseId, setResultToCaseId] = useState<Record<string, string>>({})

  const hasInput = pastedText.trim() || (uploadedEvents && uploadedEvents.length > 0)

  // Per-pack input cache (so we can restore when switching back to a pack that already has text/file)
  const [packInputs, setPackInputs] = useState<Record<string, PackInput>>({})

  // Load persisted results and per-pack state
  useEffect(() => {
    const s = loadState()
    const inputs = s.packInputs ?? {}
    setPackInputs(inputs)
    const packId = s.policyPackId ?? ""
    setPolicyPackId(packId)
    const forPack = packId ? inputs[packId] : null
    setPastedText(forPack?.pastedText ?? "")
    setUploadedEvents(forPack?.uploadedEvents ?? null)

    fetch("/api/command-center/results")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setResults(json.data)
        } else if (s.results?.length) {
          setResults(s.results)
        }
      })
      .catch(() => {
        if (s.results?.length) setResults(s.results)
      })
  }, [])

  // Build result id -> case id map so we can navigate to case when one exists
  useEffect(() => {
    fetch("/api/review-queue/cases?limit=500")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const map: Record<string, string> = {}
          for (const row of json.data as Array<{ id: string; command_center_result_id?: string }>) {
            if (row.command_center_result_id) map[row.command_center_result_id] = row.id
          }
          setResultToCaseId(map)
        }
      })
      .catch(() => {})
  }, [results.length])

  // When pack changes: save current pack's input, then show new pack's text or clear
  const handlePackChange = (newPackId: string) => {
    const nextInputs = policyPackId
      ? { ...packInputs, [policyPackId]: { pastedText, uploadedEvents } }
      : packInputs
    setPackInputs(nextInputs)
    setPolicyPackId(newPackId)
    const forNewPack = nextInputs[newPackId]
    if (forNewPack) {
      setPastedText(forNewPack.pastedText)
      setUploadedEvents(forNewPack.uploadedEvents)
    } else {
      setPastedText("")
      setUploadedEvents(null)
    }
  }

  // Persist current pack's input and all packInputs to storage
  useEffect(() => {
    const inputsToSave = policyPackId
      ? { ...packInputs, [policyPackId]: { pastedText, uploadedEvents } }
      : packInputs
    saveState({ packInputs: inputsToSave, results, policyPackId })
  }, [pastedText, uploadedEvents, results, policyPackId, packInputs])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploadLoading(true)
    setUploadedEvents(null)
    setPastedText("")
    const name = file.name.toLowerCase()
    const isCsv = name.endsWith(".csv")
    const isPdfOrTxt = name.endsWith(".pdf") || name.endsWith(".txt")

    try {
      if (isCsv) {
        // CSV: use command-center parse-data-file (unchanged)
        const formData = new FormData()
        formData.set("file", file)
        const res = await fetch("/api/command-center/parse-data-file", { method: "POST", body: formData })
        const data = await res.json()
        if (data.success && data.events?.length) {
          setUploadedEvents(data.events)
        } else {
          setError(data.error || "Could not parse CSV")
        }
      } else if (isPdfOrTxt) {
        // PDF / text: same upload as Policy Studio (/api/policy/upload)
        const formData = new FormData()
        formData.set("file", file)
        const res = await fetch("/api/policy/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.success && data.text?.trim()) {
          const text = data.text.trim()
          setPastedText(text)
          setUploadedEvents([
            {
              event_type: "DOCUMENT_VALIDATION",
              event_data: { document_text: text, source: "upload", file_name: file.name },
            },
          ])
        } else {
          setError(data.error || "Could not extract text from file")
        }
      } else {
        setError("Only .csv, .pdf, and .txt are supported.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadLoading(false)
      e.target.value = ""
    }
  }

  const handleValidate = async () => {
    if (!policyPackId) {
      setError("Select a policy pack")
      return
    }

    const pack = packs.find((p: { id: string }) => p.id === policyPackId)
    const policyPackName = pack?.name ?? "Unknown"
    const policyVersion = pack?.version ?? "1.0"

    // Note: We no longer block here on chunks_count; the API returns a clear error if no chunks are ingested.
    let events: Array<{ event_type: string; event_data: Record<string, unknown> }>

    if (uploadedEvents && uploadedEvents.length > 0) {
      events = uploadedEvents.map((e) => ({ event_type: e.event_type, event_data: e.event_data }))
    } else if (pastedText.trim()) {
      events = [
        { event_type: "DOCUMENT_VALIDATION", event_data: { document_text: pastedText.trim(), source: "paste" } },
      ]
    } else {
      setError("Upload a file or paste text to validate")
      return
    }

    setError(null)
    setValidating(true)
    const decisionResults: CommandCenterDecisionResult[] = []

    try {
      for (const ev of events) {
        const res = await fetch("/api/decisions/evaluate-agentic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: ev.event_type,
            eventData: ev.event_data,
            policyPackId,
            confidenceThreshold: CONFIDENCE_THRESHOLD,
          }),
        })
        const json = await res.json()
        const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        if (json.success && json.data) {
          decisionResults.push({
            id,
            event_type: json.data.event_type,
            event_data: json.data.event_data,
            outcome: json.data.outcome as DecisionOutcome,
            confidence: json.data.confidence,
            risk_score: json.data.risk_score,
            reasoning: json.data.reasoning,
            matched_policies: json.data.matched_policies ?? [],
            recommended_actions: json.data.recommended_actions,
            missing_information: json.data.missing_information ?? [],
            agent_metadata: json.data.agent_metadata,
            policy_pack_id: policyPackId,
            policy_pack_name: policyPackName,
            policy_version: policyVersion,
            validated_at: new Date().toISOString(),
          })
        } else {
          decisionResults.push({
            id,
            event_type: ev.event_type,
            event_data: ev.event_data,
            outcome: "REVIEW",
            confidence: 0,
            risk_score: 50,
            reasoning: json.error || "Evaluation failed",
            matched_policies: [],
            missing_information: [],
            agent_metadata: { requires_human_review: true, attempts: 0 },
            policy_pack_id: policyPackId,
            policy_pack_name: policyPackName,
            policy_version: policyVersion,
            validated_at: new Date().toISOString(),
          })
        }
      }

      // Persist to DB so results survive restart (like Policy Studio documents)
      try {
        const saveRes = await fetch("/api/command-center/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results: decisionResults }),
        })
        const saveJson = await saveRes.json()
        if (saveJson.success && Array.isArray(saveJson.data) && saveJson.data.length > 0) {
          setResults((prev) => [...saveJson.data, ...prev])
        } else {
          setResults((prev) => [...decisionResults, ...prev])
          if (saveJson.error && saveRes.status === 503) {
            setError(saveJson.error)
          }
        }
      } catch {
        setResults((prev) => [...decisionResults, ...prev])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed")
    } finally {
      setValidating(false)
    }
  }

  const downloadDecisionJson = (r: CommandCenterDecisionResult) => {
    const obj = buildDecisionExportJson(r)
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `decision-${r.outcome.toLowerCase()}-${r.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const [createCaseResult, setCreateCaseResult] = useState<CommandCenterDecisionResult | null>(null)
  const [createCaseName, setCreateCaseName] = useState("")

  const createCaseFromResult = async (r: CommandCenterDecisionResult, name?: string) => {
    setCreatingCaseId(r.id)
    setCreateCaseResult(null)
    setCreateCaseName("")
    try {
      const validation_result = buildDecisionExportJson(r)
      const res = await fetch("/api/review-queue/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validation_result,
          command_center_result_id: r.id,
          assigned_to: "sarah chen",
          policy_pack_id: r.policy_pack_id,
          ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.id) {
        setResultToCaseId((prev) => ({ ...prev, [r.id]: json.data.id }))
        router.replace(`/review-queue/cases/${json.data.id}`)
      } else {
        setError(json.error || "Failed to create case")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case")
    } finally {
      setCreatingCaseId(null)
    }
  }

  // Clear only the text area and persisted input for the selected pack; do not clear the results list
  const clearInput = () => {
    setPastedText("")
    setUploadedEvents(null)
    setError(null)
    if (policyPackId) {
      setPackInputs((prev) => {
        const next = { ...prev }
        next[policyPackId] = { pastedText: "", uploadedEvents: null }
        return { ...next }
      })
    }
  }

  // Only show results for policy packs that still exist (deleted packs' results are removed in DB; hide any stale in state)
  const packIds = new Set((packs as { id: string }[]).map((p) => p.id))
  const displayResults = results.filter((r) => packIds.has(r.policy_pack_id))

  const deleteResult = async (r: CommandCenterDecisionResult) => {
    setDeletingResultId(r.id)
    setError(null)
    try {
      await fetch(`/api/command-center/results/${r.id}`, { method: "DELETE" })
      setResults((prev) => prev.filter((x) => x.id !== r.id))
      setResultToCaseId((prev) => {
        const next = { ...prev }
        delete next[r.id]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete result")
    } finally {
      setDeletingResultId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Command Center</h1>
        <p className="text-muted-foreground">
          Upload a file or paste data to validate against policy. Results with &ge;80% confidence are AI decided; below 80% requires human review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data to validate</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Upload CSV, PDF, or text or paste text below. Data is persisted so you can return to it later.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Upload file (CSV, PDF, or text)</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="file"
                accept=".csv,.txt,.pdf"
                onChange={handleFileSelect}
                className="sr-only"
                disabled={validating || uploadLoading}
              />
              {uploadLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {uploadLoading ? "Parsing..." : "Choose CSV, PDF, or .txt"}
              </span>
            </label>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Or paste text (persisted)</label>
            <Textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value)
                setUploadedEvents(null)
              }}
              placeholder="Paste data or document text to validate..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          {uploadedEvents && uploadedEvents.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {uploadedEvents.length} event(s) from file ready to validate.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={policyPackId} onValueChange={handlePackChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select policy pack" />
              </SelectTrigger>
              <SelectContent>
                {packs.map((p: { id: string; name: string; version?: string }) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.version ? `(v${p.version})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleValidate}
              disabled={validating || !hasInput || !policyPackId}
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Validating...
                </>
              ) : (
                "Validate"
              )}
            </Button>
            {(hasInput || results.length > 0) && (
              <Button className="text-white hover:text-green-600" variant="outline" onClick={clearInput} disabled={validating}>
                Clear
              </Button>
            )}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results list (only results for existing policy packs; deleted packs' results are cascade-deleted) */}
      {displayResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>Results list</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  Click a row to view full decision. Create case to send it to Review Queue — all cases created from here appear there.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/review-queue">
                  <List className="h-4 w-4 mr-2" />
                  Review Queue (cases)
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayResults.map((r) => {
              const requiresHuman = r.agent_metadata?.requires_human_review ?? r.confidence < CONFIDENCE_THRESHOLD
              const isExpanded = expandedId === r.id

              return (
                <div
                  key={r.id}
                  className={`rounded-lg border overflow-hidden ${requiresHuman ? "border-amber-500/50 bg-amber-500/5" : ""}`}
                >
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      const caseId = resultToCaseId[r.id]
                      if (caseId) {
                        router.push(`/review-queue/cases/${caseId}`)
                        return
                      }
                      setExpandedId(isExpanded ? null : r.id)
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          r.outcome === "APPROVED" ? "default" :
                          r.outcome === "BLOCKED" ? "destructive" : "secondary"
                        }
                        className="text-sm"
                      >
                        {r.outcome}
                      </Badge>
                      {requiresHuman && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 text-xs">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Human review
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {r.policy_pack_name} (v{r.policy_version}) · {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          const caseId = resultToCaseId[r.id]
                          if (caseId) {
                            router.push(`/review-queue/cases/${caseId}`)
                            return
                          }
                          setDetailResult(r)
                        }}
                      >
                        {resultToCaseId[r.id] ? "Open case" : "View decision"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteResult(r)
                        }}
                        disabled={deletingResultId === r.id}
                      >
                        {deletingResultId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-3 space-y-2 min-h-[60px]">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Reasoning summary</p>
                        <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap line-clamp-3">{r.reasoning || "(No reasoning provided)"}</p>
                      </div>
                        
                      {r.missing_information && r.missing_information.length > 0 && (
                        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950 p-3 space-y-2 min-h-[50px]">
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Missing fields</p>
                          <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 ml-4">
                            {r.missing_information.map((field, i) => (
                              <li key={i} className="list-disc">{field}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                        
                      {r.recommended_actions && r.recommended_actions.length > 0 && (
                        <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-3 space-y-2 min-h-[50px]">
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100">✓ Recommended actions</p>
                          <ul className="text-xs text-green-800 dark:text-green-200 space-y-1 ml-4">
                            {r.recommended_actions.map((action, i) => (
                              <li key={i} className="list-disc">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="rounded-lg border bg-background p-4 space-y-3">
                        <p className="text-sm font-medium">Export JSON</p>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64  overflow-y-auto">
                          {JSON.stringify(buildDecisionExportJson(r), null, 2)}
                        </pre>
                        <p className="text-xs text-muted-foreground">
                          This JSON includes outcome, decision_type, event_data, explanations.bullets (why), matched_policies, and review (reasons, recommended_actions, missing_fields). Use it for downstream systems and audit.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button className="hover:text-white/80" variant="outline" size="sm" onClick={() => downloadDecisionJson(r)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download JSON
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setCreateCaseResult(r)
                              setCreateCaseName("")
                            }}
                            disabled={creatingCaseId === r.id}
                          >
                            {creatingCaseId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <FolderOpen className="h-4 w-4 mr-2" />
                            )}
                            Create case
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Detail modal */}
      <Dialog open={!!detailResult} onOpenChange={() => setDetailResult(null)}>
        <DialogContent className="w-[65vw] max-w-[65vw] sm:max-w-[65vw] min-w-[min(65vw,320px)] h-[90vh] max-h-[100vh] overflow-y-auto">
          {detailResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      detailResult.outcome === "APPROVED" ? "default" :
                      detailResult.outcome === "BLOCKED" ? "destructive" : "secondary"
                    }
                  >
                    {detailResult.outcome}
                  </Badge>
                  {detailResult.policy_pack_name} (v{detailResult.policy_version})
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <span>Confidence: <strong>{(detailResult.confidence * 100).toFixed(0)}%</strong></span>
                  <span>Risk: <strong>{detailResult.risk_score}/100</strong></span>
                </div>
                
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-3 space-y-2 min-h-[60px]">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Reasoning summary</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap line-clamp-3">{detailResult.reasoning || "(No reasoning provided)"}</p>
                </div>
                
                {detailResult.missing_information && detailResult.missing_information.length > 0 && (
                  <div className="rounded-lg border bg-amber-50 dark:bg-amber-950 p-3 space-y-2 min-h-[50px]">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Missing fields</p>
                    <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 ml-4">
                      {detailResult.missing_information.map((field, i) => (
                        <li key={i} className="list-disc">{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {detailResult.recommended_actions && detailResult.recommended_actions.length > 0 && (
                  <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-3 space-y-2 min-h-[50px]">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">✓ Recommended actions</p>
                    <ul className="text-xs text-green-800 dark:text-green-200 space-y-1 ml-4">
                      {detailResult.recommended_actions.map((action, i) => (
                        <li key={i} className="list-disc">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm font-medium">Export JSON</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[55vh] overflow-y-auto">
                    {JSON.stringify(buildDecisionExportJson(detailResult), null, 2)}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    This JSON includes outcome, decision_type, event_data, explanations.bullets (why), matched_policies, and review (reasons, recommended_actions, missing_fields; for BLOCKED also not_fulfilled). Use for downstream systems and audit.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadDecisionJson(detailResult)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDetailResult(null)
                        setCreateCaseResult(detailResult)
                        setCreateCaseName("")
                      }}
                      disabled={creatingCaseId === detailResult.id}
                    >
                      {creatingCaseId === detailResult.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FolderOpen className="h-4 w-4 mr-2" />
                      )}
                      Create case
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create case with optional name */}
      <Dialog open={!!createCaseResult} onOpenChange={(open) => !open && setCreateCaseResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create case</DialogTitle>
          </DialogHeader>
          {createCaseResult && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A unique case ID will be generated. Optionally give the case a name (e.g. &quot;Training Review&quot;); it will be stored as &quot;Name (CASE-1234)&quot;.
              </p>
              <div>
                <Label htmlFor="case-name">Case name (optional)</Label>
                <Input
                  id="case-name"
                  value={createCaseName}
                  onChange={(e) => setCreateCaseName(e.target.value)}
                  placeholder="e.g. Training Review"
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createCaseFromResult(createCaseResult, createCaseName || undefined)}
                disabled={creatingCaseId === createCaseResult.id}
              >
                {creatingCaseId === createCaseResult.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FolderOpen className="h-4 w-4 mr-2" />
                )}
                Create case
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
