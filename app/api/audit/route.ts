import { query } from "@/lib/supabase"
import type { AuditDecision } from "@/lib/types"

/** Derive display outcome from review queue case status and audit log. */
function deriveReviewQueueOutcome(
  caseStatus: string | null | undefined,
  auditLog: Array<{ action?: string }>
): string | null {
  if (!caseStatus) return null
  if (caseStatus === "ESCALATED") return "Escalated"
  if (caseStatus === "IN_REVIEW" || caseStatus === "NEEDS_INFO") return "Pending review"
  if (caseStatus === "FINALIZED" && auditLog.length > 0) {
    const last = auditLog[auditLog.length - 1]
    const action = (last?.action ?? "").toUpperCase()
    if (action === "APPROVE") return "Approved"
    if (action === "BLOCK") return "Blocked"
  }
  if (caseStatus === "FINALIZED") return "Finalized"
  return null
}

/**
 * GET /api/audit
 * Returns decision history from command_center_results so Audit Explorer
 * counts and list stay in sync with Command Center and Review Queue.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)
    const outcome = searchParams.get("outcome")

    let sql = `
      SELECT * FROM (
        SELECT DISTINCT ON (ccr.id)
          ccr.id,
          ccr.event_type,
          ccr.event_data,
          ccr.outcome,
          ccr.confidence,
          ccr.risk_score,
          ccr.reasoning,
          ccr.matched_policies,
          ccr.policy_pack_name,
          ccr.policy_version,
          ccr.validated_at,
          ccr.agent_metadata,
          rq.status AS case_status,
          rq.audit_log AS case_audit_log,
          rq.validation_result AS case_validation_result
        FROM command_center_results ccr
        LEFT JOIN review_queue_cases rq ON rq.command_center_result_id = ccr.id::text
        WHERE 1=1
    `
    const params: unknown[] = []
    let idx = 1

    if (outcome && ["APPROVED", "BLOCKED", "REVIEW"].includes(outcome)) {
      sql += ` AND ccr.outcome = $${idx}`
      params.push(outcome)
      idx++
    }

    sql += ` ORDER BY ccr.id, rq.updated_at DESC NULLS LAST ) sub ORDER BY validated_at DESC LIMIT $${idx}`
    params.push(limit)

    const { data: rows, error } = await query(sql, params)
    if (error) {
      if ((error as { code?: string }).code === "42P01") {
        return Response.json({ success: true, data: { decisions: [], total: 0 } })
      }
      throw error
    }

    const decisions: AuditDecision[] = (rows ?? []).map((row: Record<string, unknown>) => {
      const meta = (typeof row.agent_metadata === "object" && row.agent_metadata !== null)
        ? row.agent_metadata as Record<string, unknown>
        : {}
      const attempts = typeof meta.attempts === "number" ? meta.attempts : 1
      const searchQueries = Array.isArray(meta.search_queries) ? meta.search_queries as string[] : []
      const requiresHuman = Boolean(meta.requires_human_review) || Number(row.confidence) < 0.8
      const caseStatus = row.case_status as string | null | undefined
      const caseAuditLog = Array.isArray(row.case_audit_log) ? row.case_audit_log as Array<{ action?: string }> : []
      const reviewQueueOutcome = deriveReviewQueueOutcome(caseStatus, caseAuditLog)
      const statusConfidence = Number(row.confidence)
      const caseValidation = (typeof row.case_validation_result === "object" && row.case_validation_result !== null)
        ? row.case_validation_result as Record<string, unknown>
        : null
      const outcomeConfidence = caseValidation != null && typeof caseValidation.confidence === "number"
        ? Number(caseValidation.confidence)
        : null
      // Primary confidence: use outcome confidence when available (from review queue), else status confidence
      const confidence = outcomeConfidence != null ? outcomeConfidence : statusConfidence
      return {
        id: String(row.id),
        created_at: String(row.validated_at),
        event_type: String(row.event_type),
        event_data: (typeof row.event_data === "object" && row.event_data !== null) ? row.event_data as Record<string, unknown> : {},
        outcome: row.outcome as AuditDecision["outcome"],
        confidence,
        status_confidence: statusConfidence,
        outcome_confidence: outcomeConfidence ?? undefined,
        risk_score: Number(row.risk_score),
        reasoning: String(row.reasoning ?? ""),
        agent_attempts: attempts,
        requires_human_review: requiresHuman,
        matched_conditions: Array.isArray(row.matched_policies) ? row.matched_policies as string[] : [],
        agent_queries_used: searchQueries,
        review_queue_outcome: reviewQueueOutcome ?? undefined,
      }
    })

    return Response.json({
      success: true,
      data: {
        decisions,
        total: decisions.length,
      },
    })
  } catch (e) {
    console.error("Audit fetch error:", e)
    return Response.json({ success: false, error: "Failed to fetch audit data" }, { status: 500 })
  }
}
