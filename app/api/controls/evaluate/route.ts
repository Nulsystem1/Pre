import { controls } from "@/lib/store"
import { matchConditions } from "@/lib/json-logic"
import type { DecisionOutcome } from "@/lib/types"

export async function POST(req: Request) {
  try {
    const { eventData, policyPackId } = await req.json()

    if (!eventData) {
      return Response.json({ success: false, error: "Missing eventData" }, { status: 400 })
    }

    // Get enabled controls (optionally filtered by pack)
    let activeControls = controls.filter((c) => c.enabled)
    if (policyPackId) {
      activeControls = activeControls.filter((c) => c.policy_pack_id === policyPackId)
    }

    // Evaluate each control against the event data
    const results: Array<{
      control_id: string
      control_name: string
      matched: boolean
      action: DecisionOutcome | null
      details: Record<string, unknown>
      risk_weight: number
    }> = []

    for (const control of activeControls) {
      const { matched, details } = matchConditions(control.condition, eventData)

      results.push({
        control_id: control.control_id,
        control_name: control.name,
        matched,
        action: matched ? (control.action as DecisionOutcome) : null,
        details,
        risk_weight: control.risk_weight,
      })
    }

    // Determine final decision (highest severity wins)
    const triggeredControls = results.filter((r) => r.matched)

    let finalDecision: DecisionOutcome = "APPROVED"
    let triggeredControl = null

    if (triggeredControls.length > 0) {
      // Priority: BLOCK > REVIEW > APPROVE
      const blocked = triggeredControls.find((c) => c.action === "BLOCKED")
      const review = triggeredControls.find((c) => c.action === "REVIEW")

      if (blocked) {
        finalDecision = "BLOCKED"
        triggeredControl = blocked
      } else if (review) {
        finalDecision = "REVIEW"
        triggeredControl = review
      }
    }

    // Calculate composite risk score
    const riskScore =
      triggeredControls.length > 0
        ? Math.round(triggeredControls.reduce((sum, c) => sum + c.risk_weight * 100, 0) / triggeredControls.length)
        : 0

    return Response.json({
      success: true,
      data: {
        final_decision: finalDecision,
        risk_score: riskScore,
        triggered_control: triggeredControl,
        all_results: results,
        controls_evaluated: results.length,
        controls_triggered: triggeredControls.length,
      },
    })
  } catch (error) {
    console.error("Control evaluation error:", error)
    return Response.json({ success: false, error: "Failed to evaluate controls" }, { status: 500 })
  }
}
