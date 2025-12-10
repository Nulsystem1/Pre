"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { WebhookPreview } from "@/components/execution/webhook-preview"
import { Loader2, Play, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"
import type { PolicyPack, EventSimulationResult } from "@/lib/types"

export function EventSimulator() {
  const [policyPacks, setPolicyPacks] = useState<PolicyPack[]>([])
  const [selectedPackId, setSelectedPackId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  
  // Form fields
  const [vendorName, setVendorName] = useState("")
  const [expectedSpend, setExpectedSpend] = useState("")
  const [riskLevel, setRiskLevel] = useState<string>("")
  const [yearsInBusiness, setYearsInBusiness] = useState("")
  const [country, setCountry] = useState("")
  
  // Results
  const [result, setResult] = useState<EventSimulationResult | null>(null)

  useEffect(() => {
    loadPolicyPacks()
  }, [])

  const loadPolicyPacks = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/policy/packs")
      const { data } = await res.json()
      setPolicyPacks(data || [])
      
      if (data && data.length > 0) {
        setSelectedPackId(data[0].id)
      }
    } catch (error) {
      console.error("Error loading policy packs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!vendorName || !expectedSpend || !riskLevel || !yearsInBusiness || !country) {
      alert("Please fill in all fields")
      return
    }

    setEvaluating(true)
    setResult(null)

    try {
      const payload = {
        vendor_name: vendorName,
        expected_spend: parseFloat(expectedSpend),
        risk_level: riskLevel,
        years_in_business: parseInt(yearsInBusiness),
        country,
        email_verified: true,
        business_registration_verified: true,
        insurance_provided: true,
      }

      const res = await fetch("/api/events/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "ONBOARDING",
          entity_id: `vendor-${Date.now()}`,
          payload,
          policy_pack_id: selectedPackId,
        }),
      })

      const { data } = await res.json()
      setResult(data)

      // Create audit event
      await fetch("/api/audit-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "EVENT_SIMULATED",
          description: `Simulated vendor onboarding event for ${vendorName}`,
          actor: "system",
          metadata: {
            confidence: data.confidence_score,
            routing: data.routing,
            outcome: data.final_outcome,
          },
        }),
      })
    } catch (error) {
      console.error("Error evaluating event:", error)
    } finally {
      setEvaluating(false)
    }
  }

  const handleReset = () => {
    setVendorName("")
    setExpectedSpend("")
    setRiskLevel("")
    setYearsInBusiness("")
    setCountry("")
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Simulator</CardTitle>
          <CardDescription>
            Simulate vendor onboarding events and see how the system evaluates them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Policy Pack</Label>
            <Select value={selectedPackId} onValueChange={setSelectedPackId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select policy pack" />
              </SelectTrigger>
              <SelectContent>
                {policyPacks.map((pack) => (
                  <SelectItem key={pack.id} value={pack.id}>
                    {pack.name} v{pack.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                placeholder="e.g., Acme Supplies Inc."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedSpend">Expected Annual Spend ($)</Label>
              <Input
                id="expectedSpend"
                type="number"
                placeholder="e.g., 8500"
                value={expectedSpend}
                onChange={(e) => setExpectedSpend(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskLevel">Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                id="yearsInBusiness"
                type="number"
                placeholder="e.g., 5"
                value={yearsInBusiness}
                onChange={(e) => setYearsInBusiness(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleEvaluate} disabled={evaluating} className="flex-1">
              {evaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Evaluate Event
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Decision Summary */}
          <Card className={
            result.final_outcome === "APPROVED"
              ? "border-green-200 bg-green-50"
              : result.final_outcome === "BLOCKED"
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
          }>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {result.final_outcome === "APPROVED" && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Decision: APPROVED
                    </>
                  )}
                  {result.final_outcome === "BLOCKED" && (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Decision: BLOCKED
                    </>
                  )}
                  {result.final_outcome === "REVIEW" && (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Decision: REVIEW REQUIRED
                    </>
                  )}
                </CardTitle>
                <Badge
                  variant={
                    result.routing === "auto_execute" ? "default" : "secondary"
                  }
                >
                  {result.routing === "auto_execute" ? "Auto-Execute" : "Human Review"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence Score:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        result.confidence_score >= 80
                          ? "bg-green-600"
                          : result.confidence_score >= 50
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }`}
                      style={{ width: `${result.confidence_score}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm">
                    {result.confidence_score.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Controls Triggered:</span>
                <span className="font-semibold">{result.decisions.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Execution Payload */}
          {result.routing === "auto_execute" && result.execution_payload && (
            <WebhookPreview
              payload={result.execution_payload}
              targetName={result.execution_payload.execution_target as string}
              targetType={result.execution_payload.execution_type as string}
            />
          )}

          {/* Review Queue Notice */}
          {result.routing === "human_review" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Routed to Human Review</p>
                    <p className="text-sm text-muted-foreground">
                      Confidence score below threshold. Review item created for manual approval.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

