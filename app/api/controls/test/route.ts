import { controls } from "@/lib/store"
import { evaluateCondition, matchConditions } from "@/lib/json-logic"
import type { DecisionOutcome } from "@/lib/types"

// Test scenarios for control validation
const testScenarios = [
  {
    name: "Low-risk US customer",
    eventType: "ONBOARDING",
    data: {
      customer: {
        id_verified: true,
        address_verified: true,
        age: 35,
        risk_score: 25,
        country: "US",
        is_pep: false,
        pep_match_confidence: 0,
        account_type: "personal",
      },
    },
    expectedDecision: "APPROVED",
  },
  {
    name: "Unverified ID customer",
    eventType: "ONBOARDING",
    data: {
      customer: {
        id_verified: false,
        address_verified: true,
        age: 28,
        risk_score: 40,
        country: "UK",
        is_pep: false,
        pep_match_confidence: 0,
        account_type: "personal",
      },
    },
    expectedDecision: "BLOCKED",
  },
  {
    name: "High-risk score + unverified address",
    eventType: "ONBOARDING",
    data: {
      customer: {
        id_verified: true,
        address_verified: false,
        age: 45,
        risk_score: 65,
        country: "DE",
        is_pep: false,
        pep_match_confidence: 0,
        account_type: "personal",
      },
    },
    expectedDecision: "REVIEW",
  },
  {
    name: "PEP customer with high confidence",
    eventType: "ONBOARDING",
    data: {
      customer: {
        id_verified: true,
        address_verified: true,
        age: 55,
        risk_score: 72,
        country: "UK",
        is_pep: true,
        pep_match_confidence: 0.85,
        account_type: "personal",
      },
    },
    expectedDecision: "REVIEW",
  },
  {
    name: "Customer from sanctioned country",
    eventType: "ONBOARDING",
    data: {
      customer: {
        id_verified: true,
        address_verified: true,
        age: 40,
        risk_score: 90,
        country: "KP",
        is_pep: false,
        pep_match_confidence: 0,
        account_type: "personal",
      },
    },
    expectedDecision: "BLOCKED",
  },
  {
    name: "Minor attempting to open account",
    eventType: "ONBOARDING",
    data: {
      customer: {
        id_verified: true,
        address_verified: true,
        age: 16,
        risk_score: 10,
        country: "US",
        is_pep: false,
        pep_match_confidence: 0,
        account_type: "personal",
      },
    },
    expectedDecision: "BLOCKED",
  },
  {
    name: "High-value wire to risky country",
    eventType: "TRANSACTION",
    data: {
      customer: {
        country: "US",
        is_pep: false,
      },
      transaction: {
        amount: 50000,
        type: "wire_transfer",
        destination_country: "RU",
        currency: "USD",
      },
    },
    expectedDecision: "REVIEW",
  },
  {
    name: "Normal low-value transaction",
    eventType: "TRANSACTION",
    data: {
      customer: {
        country: "US",
        is_pep: false,
      },
      transaction: {
        amount: 500,
        type: "card_payment",
        destination_country: "US",
        currency: "USD",
      },
    },
    expectedDecision: "APPROVED",
  },
]

export async function GET() {
  // Run all test scenarios against current controls
  const enabledControls = controls.filter((c) => c.enabled)

  const results = testScenarios.map((scenario) => {
    const triggeredControls: Array<{ control_id: string; action: string }> = []

    for (const control of enabledControls) {
      const matched = evaluateCondition(control.condition, scenario.data)
      if (matched) {
        triggeredControls.push({
          control_id: control.control_id,
          action: control.action,
        })
      }
    }

    // Determine actual decision
    let actualDecision: DecisionOutcome = "APPROVED"
    if (triggeredControls.some((c) => c.action === "BLOCK")) {
      actualDecision = "BLOCKED"
    } else if (triggeredControls.some((c) => c.action === "REVIEW")) {
      actualDecision = "REVIEW"
    }

    const passed = actualDecision === scenario.expectedDecision

    return {
      scenario: scenario.name,
      event_type: scenario.eventType,
      expected: scenario.expectedDecision,
      actual: actualDecision,
      passed,
      controls_triggered: triggeredControls,
    }
  })

  const passedCount = results.filter((r) => r.passed).length
  const totalCount = results.length

  return Response.json({
    success: true,
    data: {
      summary: {
        passed: passedCount,
        failed: totalCount - passedCount,
        total: totalCount,
        pass_rate: Math.round((passedCount / totalCount) * 100),
      },
      results,
    },
  })
}

export async function POST(req: Request) {
  // Run a single custom test
  try {
    const { data, expectedDecision } = await req.json()

    const enabledControls = controls.filter((c) => c.enabled)
    const triggeredControls: Array<{
      control_id: string
      control_name: string
      action: string
      details: Record<string, unknown>
    }> = []

    for (const control of enabledControls) {
      const { matched, details } = matchConditions(control.condition, data)
      if (matched) {
        triggeredControls.push({
          control_id: control.control_id,
          control_name: control.name,
          action: control.action,
          details,
        })
      }
    }

    let actualDecision: DecisionOutcome = "APPROVED"
    if (triggeredControls.some((c) => c.action === "BLOCK")) {
      actualDecision = "BLOCKED"
    } else if (triggeredControls.some((c) => c.action === "REVIEW")) {
      actualDecision = "REVIEW"
    }

    const passed = expectedDecision ? actualDecision === expectedDecision : true

    return Response.json({
      success: true,
      data: {
        decision: actualDecision,
        passed,
        expected: expectedDecision,
        controls_triggered: triggeredControls,
        controls_evaluated: enabledControls.length,
      },
    })
  } catch (error) {
    console.error("Custom test error:", error)
    return Response.json({ success: false, error: "Failed to run test" }, { status: 500 })
  }
}
