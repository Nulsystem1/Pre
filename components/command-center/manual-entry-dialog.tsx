"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles } from "lucide-react"

interface ManualEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  policyPackId?: string
}

export function ManualEntryDialog({ open, onOpenChange, onSubmit, policyPackId }: ManualEntryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [formData, setFormData] = useState({
    vendor_name: "",
    country: "",
    annual_spend: "",
    sanctions_check: "CLEAR",
    business_type: "",
    relationship_length_years: "",
    priority: "medium",
  })

  const handleAutofill = async () => {
    setAutofilling(true)
    try {
      const response = await fetch("/api/command-center/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partial_input: formData.vendor_name || "Generate realistic vendor data",
        }),
      })

      const result = await response.json()
      if (result.success) {
        setFormData({
          vendor_name: result.data.vendor.name,
          country: result.data.vendor.country,
          annual_spend: result.data.vendor.annual_spend.toString(),
          sanctions_check: result.data.vendor.sanctions_check,
          business_type: result.data.vendor.business_type,
          relationship_length_years: result.data.vendor.relationship_length_years.toString(),
          priority: result.data.suggested_priority,
        })
      }
    } catch (err) {
      console.error("Autofill failed:", err)
    } finally {
      setAutofilling(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const eventData = {
        vendor: {
          name: formData.vendor_name,
          country: formData.country,
          annual_spend: parseFloat(formData.annual_spend),
          sanctions_check: formData.sanctions_check,
          business_type: formData.business_type,
          relationship_length_years: parseInt(formData.relationship_length_years),
        },
      }

      const response = await fetch("/api/command-center/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "VENDOR_ONBOARDING",
          event_data: eventData,
          priority: formData.priority,
          policy_pack_id: policyPackId,
          source: "manual",
        }),
      })

      const result = await response.json()
      if (result.success) {
        onSubmit(result.data)
        onOpenChange(false)
        // Reset form
        setFormData({
          vendor_name: "",
          country: "",
          annual_spend: "",
          sanctions_check: "CLEAR",
          business_type: "",
          relationship_length_years: "",
          priority: "medium",
        })
      }
    } catch (err) {
      console.error("Submit failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Event Entry</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add vendor onboarding event manually (simulates system integration)
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutofill}
              disabled={autofilling}
            >
              {autofilling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  AI Filling...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Autofill (Demo)
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country Code *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="US"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_spend">Annual Spend ($) *</Label>
              <Input
                id="annual_spend"
                type="number"
                value={formData.annual_spend}
                onChange={(e) => setFormData({ ...formData, annual_spend: e.target.value })}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sanctions_check">Sanctions Check *</Label>
              <Select
                value={formData.sanctions_check}
                onValueChange={(value) => setFormData({ ...formData, sanctions_check: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLEAR">Clear</SelectItem>
                  <SelectItem value="MATCH">Match</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                placeholder="Technology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship_length">Relationship Length (years)</Label>
              <Input
                id="relationship_length"
                type="number"
                value={formData.relationship_length_years}
                onChange={(e) => setFormData({ ...formData, relationship_length_years: e.target.value })}
                placeholder="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.vendor_name || !formData.country || !formData.annual_spend}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit to Queue"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

