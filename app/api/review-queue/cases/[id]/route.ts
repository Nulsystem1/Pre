import { query } from "@/lib/supabase"

const SELECT_COLS_WITH_NAME = `id, case_id, name, status, assigned_to, validation_result, attachments, audit_log,
  structured_edits, command_center_result_id, policy_pack_id, created_at, updated_at`
const SELECT_COLS_NO_NAME = `id, case_id, status, assigned_to, validation_result, attachments, audit_log,
  structured_edits, command_center_result_id, policy_pack_id, created_at, updated_at`

function toCaseRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    case_id: row.case_id,
    name: row.name ?? null,
    status: row.status,
    assigned_to: row.assigned_to,
    validation_result: row.validation_result ?? {},
    attachments: row.attachments ?? [],
    audit_log: row.audit_log ?? [],
    structured_edits: row.structured_edits ?? {},
    command_center_result_id: row.command_center_result_id,
    policy_pack_id: row.policy_pack_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * GET /api/review-queue/cases/[id]
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let rows: Record<string, unknown>[] | null = null
    const { data: dataWithName, error: errWithName } = await query(
      `SELECT ${SELECT_COLS_WITH_NAME} FROM review_queue_cases WHERE id = $1`,
      [id]
    )
    if (!errWithName) {
      rows = dataWithName
    } else {
      const code = (errWithName as { code?: string }).code
      if (code === "42703" || code === "42883") {
        const { data: dataNoName, error: errNoName } = await query(
          `SELECT ${SELECT_COLS_NO_NAME} FROM review_queue_cases WHERE id = $1`,
          [id]
        )
        if (errNoName) throw errNoName
        rows = dataNoName
      } else {
        throw errWithName
      }
    }

    const row = rows?.[0]
    if (!row) {
      return Response.json({ success: false, error: "Case not found" }, { status: 404 })
    }

    return Response.json({ success: true, data: toCaseRow(row) })
  } catch (e) {
    console.error("Get review queue case error:", e)
    return Response.json({ success: false, error: "Failed to get case" }, { status: 500 })
  }
}

/**
 * PATCH /api/review-queue/cases/[id]
 * Update case: status, attachments, structured_edits.
 * For Re-run: send { re_run_validation_result: {...} } → replace validation_result, append audit_log (same case_id).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const {
      status,
      assigned_to,
      attachments,
      structured_edits,
      re_run_validation_result,
      decision_action,
      actor = "sarah chen",
      name,
    } = body

    const now = new Date().toISOString()

    if (re_run_validation_result != null) {
      // Re-run: keep same case_id, replace validation_result, append audit_log
      const { data: current } = await query(
        "SELECT validation_result, audit_log FROM review_queue_cases WHERE id = $1",
        [id]
      )
      const row = current?.[0]
      if (!row) {
        return Response.json({ success: false, error: "Case not found" }, { status: 404 })
      }
      const auditLog = Array.isArray(row.audit_log) ? row.audit_log : []
      auditLog.push({
        timestamp: now,
        action: "RE_RUN_VALIDATION",
        actor,
        details: { previous_confidence: (row.validation_result as Record<string, unknown>)?.confidence },
      })
      const { data: updated, error } = await query(
        `UPDATE review_queue_cases
         SET validation_result = $1, audit_log = $2, updated_at = $3
         WHERE id = $4
         RETURNING ${SELECT_COLS_NO_NAME}`,
        [
          JSON.stringify(re_run_validation_result),
          JSON.stringify(auditLog),
          now,
          id,
        ]
      )
      if (error) throw error
      const r = updated?.[0]
      if (!r) return Response.json({ success: false, error: "Case not found" }, { status: 404 })
      return Response.json({ success: true, data: toCaseRow(r) })
    }

    // Status flow: Approve/Block → FINALIZED; Escalate → ESCALATED; Request More Info → NEEDS_INFO; Re-run unclear → IN_REVIEW
    let newStatus: string | undefined
    if (decision_action === "approve" || decision_action === "block") {
      newStatus = "FINALIZED"
    } else if (decision_action === "escalate") {
      newStatus = "ESCALATED"
    } else if (decision_action === "request_more_info") {
      newStatus = "NEEDS_INFO"
    } else if (status) {
      newStatus = status
    }

    const updates: string[] = ["updated_at = $1"]
    const values: unknown[] = [now]
    let idx = 2

    if (newStatus) {
      updates.push(`status = $${idx}`)
      values.push(newStatus)
      idx++
    }
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${idx}`)
      values.push(assigned_to)
      idx++
    }
    if (attachments !== undefined) {
      updates.push(`attachments = $${idx}`)
      values.push(JSON.stringify(attachments))
      idx++
    }
    if (structured_edits !== undefined) {
      updates.push(`structured_edits = $${idx}`)
      values.push(JSON.stringify(structured_edits))
      idx++
    }
    const hasNameUpdate = name !== undefined && typeof name === "string"
    if (hasNameUpdate) {
      updates.push(`name = $${idx}`)
      values.push(name.trim() || null)
      idx++
    }
    if (decision_action) {
      const { data: cur } = await query(
        "SELECT audit_log FROM review_queue_cases WHERE id = $1",
        [id]
      )
      const auditLog = Array.isArray(cur?.[0]?.audit_log) ? cur[0].audit_log : []
      auditLog.push({
        timestamp: now,
        action: decision_action.toUpperCase(),
        actor,
      })
      updates.push(`audit_log = $${idx}`)
      values.push(JSON.stringify(auditLog))
      idx++
    }

    values.push(id)
    let result: Record<string, unknown>[] | null = null
    let updateError: unknown = null
    const updateSql = `UPDATE review_queue_cases SET ${updates.join(", ")} WHERE id = $${idx} RETURNING ${SELECT_COLS_NO_NAME}`

    const res = await query(updateSql, values)
    updateError = res.error
    result = res.data ?? null

    if (updateError && hasNameUpdate && ((updateError as { code?: string }).code === "42703" || (updateError as { code?: string }).code === "42883")) {
      const nameUpdateIndex = updates.findIndex((u) => u.startsWith("name = "))
      const updatesNoName = updates
        .filter((u) => !u.startsWith("name = "))
        .map((u, i) => u.replace(/\$\d+/, `$${i + 1}`))
      const valuesNoName = [...values.slice(0, nameUpdateIndex), ...values.slice(nameUpdateIndex + 1)]
      const idxNoName = valuesNoName.length
      const res2 = await query(
        `UPDATE review_queue_cases SET ${updatesNoName.join(", ")} WHERE id = $${idxNoName} RETURNING ${SELECT_COLS_NO_NAME}`,
        valuesNoName
      )
      if (res2.error) throw res2.error
      result = res2.data ?? null
    } else if (updateError) {
      throw updateError
    }

    const r = result?.[0]
    if (!r) {
      return Response.json({ success: false, error: "Case not found" }, { status: 404 })
    }
    return Response.json({ success: true, data: toCaseRow(r) })
  } catch (e) {
    console.error("Update review queue case error:", e)
    return Response.json({ success: false, error: "Failed to update case" }, { status: 500 })
  }
}
