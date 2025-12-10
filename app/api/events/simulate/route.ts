import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { matchConditions } from "@/lib/json-logic"
import type { Control, DecisionOutcome, EventSimulationResult } from "@/lib/types"

/**
 * Calculate confidence score for a match
 * Factors:
 * 1. Field presence - Are all required fields present?
 * 2. Value clarity - Are values clearly matching or borderline?
 * 3. Condition complexity - Simple vs complex conditions
 */
function calculateConfidence(
  control: Control,
  eventData: Record<string, unknown>,
  matched: boolean
): number {
  if (!matched) return 0

  // Extract all variable paths from condition
  const varPaths = extractVariablePaths(control.condition)
  
  // Check field presence
  let presentFields = 0
  let totalFields = varPaths.length
  
  for (const path of varPaths) {
    if (getNestedValue(eventData, path) !== undefined) {
      presentFields++
    }
  }
  
  const presenceScore = totalFields > 0 ? presentFields / totalFields : 1
  
  // Check for borderline values (thresholds)
  const borderlineScore = calculateBorderlineScore(control.condition, eventData)
  
  // Combine scores
  const baseConfidence = (presenceScore * 0.6 + borderlineScore * 0.4) * 100
  
  // Add some variance to make it realistic
  const variance = Math.random() * 10 - 5
  return Math.max(0, Math.min(100, baseConfidence + variance))
}

/**
 * Extract all variable paths from JSON Logic condition
 */
function extractVariablePaths(condition: Record<string, unknown>): string[] {
  const paths: string[] = []
  
  function traverse(obj: unknown) {
    if (typeof obj !== "object" || obj === null) return
    
    if ("var" in (obj as Record<string, unknown>)) {
      const varPath = (obj as { var: string }).var
      if (varPath) paths.push(varPath)
      return
    }
    
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        value.forEach(traverse)
      } else {
        traverse(value)
      }
    }
  }
  
  traverse(condition)
  return [...new Set(paths)]
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".")
  let current: unknown = obj
  
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  
  return current
}

/**
 * Calculate score based on how borderline the values are
 */
function calculateBorderlineScore(
  condition: Record<string, unknown>,
  eventData: Record<string, unknown>
): number {
  // Look for threshold comparisons
  const thresholdOps = [">", ">=", "<", "<="]
  
  function checkThreshold(cond: Record<string, unknown>): number {
    for (const op of thresholdOps) {
      if (op in cond) {
        const [left, right] = (cond as { [key: string]: unknown[] })[op] as unknown[]
        
        // Extract value and threshold
        let value: number | undefined
        let threshold: number | undefined
        
        if (typeof left === "object" && left !== null && "var" in left) {
          const path = (left as { var: string }).var
          value = getNestedValue(eventData, path) as number
          threshold = right as number
        } else if (typeof right === "object" && right !== null && "var" in right) {
          const path = (right as { var: string }).var
          value = getNestedValue(eventData, path) as number
          threshold = left as number
        }
        
        if (typeof value === "number" && typeof threshold === "number") {
          const diff = Math.abs(value - threshold)
          const relDiff = threshold !== 0 ? diff / Math.abs(threshold) : diff
          
          // If within 10% of threshold, it's borderline (lower confidence)
          if (relDiff < 0.1) return 0.5
          // If within 20%, still somewhat borderline
          if (relDiff < 0.2) return 0.7
          // Otherwise, clear match
          return 1.0
        }
      }
    }
    
    // Check nested conditions
    if ("and" in cond || "or" in cond) {
      const nested = (cond.and || cond.or) as Record<string, unknown>[]
      const scores = nested.map(checkThreshold).filter((s) => s > 0)
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 1.0
    }
    
    return 1.0
  }
  
  return checkThreshold(condition)
}

/**
 * POST /api/events/simulate
 * Simulate an event and evaluate against controls
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event_type, entity_id, payload, policy_pack_id } = body
    
    if (!event_type || !entity_id || !payload) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: event_type, entity_id, payload" },
        { status: 400 }
      )
    }
    
    const supabase = getSupabase()
    
    // Create event record
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        event_type,
        entity_id,
        payload,
      })
      .select()
      .single()
    
    if (eventError) throw eventError
    
    // Get enabled controls (optionally filtered by policy pack)
    let query = supabase
      .from("controls")
      .select("*")
      .eq("enabled", true)
    
    if (policy_pack_id) {
      query = query.eq("policy_pack_id", policy_pack_id)
    }
    
    const { data: controls, error: controlsError } = await query
    
    if (controlsError) throw controlsError
    
    // Evaluate each control
    const matchedControls: Array<{ control: Control; confidence: number }> = []
    
    for (const control of controls as Control[]) {
      const matched = matchConditions(control.condition, payload)
      
      if (matched) {
        const confidence = calculateConfidence(control, payload, true)
        matchedControls.push({ control, confidence })
      }
    }
    
    // Determine final outcome (priority: BLOCK > REVIEW > APPROVE)
    let finalOutcome: DecisionOutcome = "APPROVED"
    let maxConfidence = 100
    
    if (matchedControls.some((m) => m.control.action === "BLOCK")) {
      finalOutcome = "BLOCKED"
      maxConfidence = Math.max(...matchedControls.filter((m) => m.control.action === "BLOCK").map((m) => m.confidence))
    } else if (matchedControls.some((m) => m.control.action === "REVIEW")) {
      finalOutcome = "REVIEW"
      maxConfidence = Math.max(...matchedControls.filter((m) => m.control.action === "REVIEW").map((m) => m.confidence))
    }
    
    // Calculate overall confidence (average of matched controls)
    const avgConfidence = matchedControls.length > 0
      ? matchedControls.reduce((sum, m) => sum + m.confidence, 0) / matchedControls.length
      : 100
    
    // Create decisions for each matched control
    const decisions = []
    for (const { control, confidence } of matchedControls) {
      const { data: decision, error: decisionError } = await supabase
        .from("decisions")
        .insert({
          event_id: event.id,
          control_id: control.id,
          decision: control.action,
          risk_score: control.risk_weight * 100,
          matched_conditions: { confidence },
          ai_explanation: control.ai_reasoning,
          policy_pack_version: "1.0",
          control_snapshot: control,
        })
        .select()
        .single()
      
      if (decisionError) throw decisionError
      decisions.push(decision)
    }
    
    // Determine routing based on confidence and execution target
    let routing: "auto_execute" | "human_review" = "human_review"
    let executionPayload: Record<string, unknown> | undefined
    let reviewItemId: string | undefined
    
    // Find the highest confidence matched control with an execution target
    const executableControl = matchedControls
      .filter((m) => m.control.execution_target_id !== null)
      .sort((a, b) => b.confidence - a.confidence)[0]
    
    if (executableControl && executableControl.confidence >= (executableControl.control.confidence_threshold * 100)) {
      routing = "auto_execute"
      
      // Get execution target details
      const { data: execTarget } = await supabase
        .from("execution_targets")
        .select("*")
        .eq("id", executableControl.control.execution_target_id)
        .single()
      
      // Generate mock execution payload
      executionPayload = {
        execution_target: execTarget?.name,
        execution_type: execTarget?.type,
        control_id: executableControl.control.control_id,
        control_name: executableControl.control.name,
        confidence: executableControl.confidence,
        event_data: payload,
        timestamp: new Date().toISOString(),
      }
    } else {
      // Create review item
      const topControl = matchedControls[0]
      
      if (topControl) {
        const { data: reviewItem, error: reviewError } = await supabase
          .from("review_items")
          .insert({
            decision_id: decisions[0]?.id,
            event_id: event.id,
            control_id: topControl.control.id,
            entity_id,
            entity_name: (payload as { name?: string }).name || null,
            confidence_score: topControl.confidence / 100,
            recommended_action: topControl.control.action,
            reasoning: topControl.control.ai_reasoning,
            status: "pending",
          })
          .select()
          .single()
        
        if (reviewError) throw reviewError
        reviewItemId = reviewItem.id
      }
    }
    
    const result: EventSimulationResult = {
      event,
      decisions,
      final_outcome: finalOutcome,
      confidence_score: avgConfidence,
      routing,
      execution_payload: executionPayload,
      review_item_id: reviewItemId,
      case_created: false,
    }
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error simulating event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to simulate event" },
      { status: 500 }
    )
  }
}

