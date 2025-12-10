"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WebhookPreview } from "@/components/execution/webhook-preview"
import { Loader2, CheckCircle2, Settings } from "lucide-react"
import type { Control, ExecutionTarget } from "@/lib/types"

interface ExecutionMappingsProps {
  policyPackId: string
}

export function ExecutionMappings({ policyPackId }: ExecutionMappingsProps) {
  const [controls, setControls] = useState<Control[]>([])
  const [executionTargets, setExecutionTargets] = useState<ExecutionTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [savingControlId, setSavingControlId] = useState<string | null>(null)
  const [previewControl, setPreviewControl] = useState<Control | null>(null)
  const [previewPayload, setPreviewPayload] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    loadData()
  }, [policyPackId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [controlsRes, targetsRes] = await Promise.all([
        fetch(`/api/policy/packs/${policyPackId}`),
        fetch("/api/execution-targets"),
      ])

      const { data: pack } = await controlsRes.json()
      const { data: targets } = await targetsRes.json()

      setControls(pack?.controls || [])
      setExecutionTargets(targets || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecutionTargetChange = async (controlId: string, executionTargetId: string | null) => {
    setSavingControlId(controlId)
    try {
      const control = controls.find((c) => c.id === controlId)
      if (!control) return

      await fetch(`/api/controls/${controlId}/execution`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          execution_target_id: executionTargetId || null,
        }),
      })

      // Update local state
      setControls(controls.map((c) =>
        c.id === controlId
          ? { ...c, execution_target_id: executionTargetId || null }
          : c
      ))
    } catch (error) {
      console.error("Error updating execution target:", error)
    } finally {
      setSavingControlId(null)
    }
  }

  const handleConfidenceThresholdChange = async (controlId: string, threshold: number) => {
    setSavingControlId(controlId)
    try {
      await fetch(`/api/controls/${controlId}/execution`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confidence_threshold: threshold,
        }),
      })

      // Update local state
      setControls(controls.map((c) =>
        c.id === controlId
          ? { ...c, confidence_threshold: threshold }
          : c
      ))
    } catch (error) {
      console.error("Error updating confidence threshold:", error)
    } finally {
      setSavingControlId(null)
    }
  }

  const handlePreviewPayload = (control: Control) => {
    const target = executionTargets.find((t) => t.id === control.execution_target_id)
    
    const mockPayload = {
      execution_target: target?.name || "Unknown",
      execution_type: target?.type || "Unknown",
      control_id: control.control_id,
      control_name: control.name,
      confidence: 0.95,
      event_data: {
        vendor_name: "Acme Supplies Inc.",
        expected_spend: 8500,
        risk_level: "Low",
        years_in_business: 5,
        country: "USA",
      },
      timestamp: new Date().toISOString(),
    }

    setPreviewControl(control)
    setPreviewPayload(mockPayload)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (controls.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            No controls found. Generate controls from the policy text first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execution Mappings</CardTitle>
          <CardDescription>
            Map controls to execution targets for automated actions. Controls with confidence above the threshold will auto-execute.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Execution Target</TableHead>
                <TableHead>Confidence Threshold</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {controls.map((control) => {
                const target = executionTargets.find((t) => t.id === control.execution_target_id)
                const isSaving = savingControlId === control.id

                return (
                  <TableRow key={control.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{control.name}</div>
                        <div className="text-xs text-muted-foreground">{control.control_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Select
                        value={control.execution_target_id || "none"}
                        onValueChange={(value) => {
                          handleExecutionTargetChange(control.id, value === "none" ? null : value)
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="No target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No target (Manual only)</SelectItem>
                          {executionTargets.filter((t) => t.enabled).map((target) => (
                            <SelectItem key={target.id} value={target.id}>
                              {target.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {target && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {target.integration_label} • {target.type}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={control.confidence_threshold}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0 && val <= 1) {
                            handleConfidenceThresholdChange(control.id, val)
                          }
                        }}
                        className="w-20"
                        disabled={isSaving}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(control.confidence_threshold * 100)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewPayload(control)}
                        disabled={!control.execution_target_id}
                      >
                        <Settings className="mr-2 h-3 w-3" />
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {previewPayload && previewControl && (
        <WebhookPreview
          payload={previewPayload}
          targetName={executionTargets.find((t) => t.id === previewControl.execution_target_id)?.name}
          targetType={executionTargets.find((t) => t.id === previewControl.execution_target_id)?.type}
        />
      )}
    </div>
  )
}

