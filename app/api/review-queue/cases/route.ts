import { query } from "@/lib/supabase"

function isConnectionRefused(e: unknown): boolean {
  const err = e as { code?: string; errors?: Array<{ code?: string }> }
  if (err?.code === "ECONNREFUSED") return true
  if (err?.errors?.some((x) => x?.code === "ECONNREFUSED")) return true
  return false
}

function nextCaseId(): string {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `CASE-${n}`
}

/**
 * GET /api/review-queue/cases
 * List review queue cases with filters: status, assigned_to (My Cases), high_risk_only
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assigned_to")
    const highRiskOnly = searchParams.get("high_risk_only") === "true"
    const commandCenterResultId = searchParams.get("command_center_result_id")
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200)

    let sql = `
      SELECT id, case_id, name, status, assigned_to, validation_result, attachments, audit_log,
             structured_edits, command_center_result_id, policy_pack_id, created_at, updated_at
      FROM review_queue_cases
      WHERE 1=1
    `
    const params: unknown[] = []
    let idx = 1

    if (status) {
      sql += ` AND status = $${idx}`
      params.push(status)
      idx++
    }
    if (assignedTo) {
      sql += ` AND assigned_to = $${idx}`
      params.push(assignedTo)
      idx++
    }
    if (highRiskOnly) {
      sql += ` AND (validation_result->>'risk_score')::int >= 50`
    }
    if (commandCenterResultId) {
      sql += ` AND command_center_result_id = $${idx}`
      params.push(commandCenterResultId)
      idx++
    }

    sql += ` ORDER BY created_at DESC LIMIT $${idx}`
    params.push(limit)

    let rows: Record<string, unknown>[] | null = null
    const { data: dataWithName, error: errWithName } = await query(sql, params)
    if (!errWithName) {
      rows = dataWithName
    } else {
      const code = (errWithName as { code?: string }).code
      if (code === "42P01") return Response.json({ success: true, data: [] })
      if (code === "42703" || code === "42883") {
        const paramsNoName: unknown[] = []
        let idxN = 1
        let sqlNoName = `
          SELECT id, case_id, status, assigned_to, validation_result, attachments, audit_log,
                 structured_edits, command_center_result_id, policy_pack_id, created_at, updated_at
          FROM review_queue_cases
          WHERE 1=1
        `
        if (status) { sqlNoName += ` AND status = $${idxN}`; paramsNoName.push(status); idxN++ }
        if (assignedTo) { sqlNoName += ` AND assigned_to = $${idxN}`; paramsNoName.push(assignedTo); idxN++ }
        if (highRiskOnly) sqlNoName += ` AND (validation_result->>'risk_score')::int >= 50`
        if (commandCenterResultId) { sqlNoName += ` AND command_center_result_id = $${idxN}`; paramsNoName.push(commandCenterResultId); idxN++ }
        sqlNoName += ` ORDER BY created_at DESC LIMIT $${idxN}`
        paramsNoName.push(limit)
        const { data: dataNoName, error: errNoName } = await query(sqlNoName, paramsNoName)
        if (errNoName) throw errNoName
        rows = dataNoName
      } else {
        throw errWithName
      }
    }

    const cases = (rows ?? []).map((row: Record<string, unknown>) => ({
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
    }))

    return Response.json({ success: true, data: cases })
  } catch (e) {
    console.error("List review queue cases error:", e)
    if (isConnectionRefused(e)) {
      return Response.json(
        {
          success: false,
          error: "Database unavailable. Start Postgres and set POSTGRES_URL.",
          code: "ECONNREFUSED",
        },
        { status: 503 }
      )
    }
    return Response.json({ success: false, error: "Failed to list cases" }, { status: 500 })
  }
}

/**
 * POST /api/review-queue/cases
 * Create a case from a Command Center validation result (template JSON).
 * Body: { validation_result, command_center_result_id?, assigned_to? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      validation_result,
      command_center_result_id,
      assigned_to = "sarah chen",
      policy_pack_id,
      name: nameInput,
    } = body

    if (!validation_result || typeof validation_result !== "object") {
      return Response.json(
        { success: false, error: "validation_result object is required" },
        { status: 400 }
      )
    }

    let caseId = nextCaseId()
    const existing = await query(
      "SELECT case_id FROM review_queue_cases WHERE case_id = $1",
      [caseId]
    )
    if (existing.data?.length) {
      caseId = nextCaseId()
    }

    const outcome = (validation_result as Record<string, unknown>)?.outcome
    const name =
      typeof nameInput === "string" && nameInput.trim()
        ? `${nameInput.trim()} (${caseId})`
        : `${outcome ?? "Case"} – ${caseId}`

    const now = new Date().toISOString()
    const { data: inserted, error } = await query(
      `INSERT INTO review_queue_cases (
        case_id, name, status, assigned_to, validation_result, attachments, audit_log,
        command_center_result_id, policy_pack_id, created_at, updated_at
      ) VALUES ($1, $2, 'IN_REVIEW', $3, $4, '[]', '[]', $5, $6, $7, $7)
      RETURNING id, case_id, name, status, assigned_to, validation_result, attachments, audit_log,
                structured_edits, command_center_result_id, policy_pack_id, created_at, updated_at`,
      [
        caseId,
        name,
        assigned_to ?? null,
        JSON.stringify(validation_result),
        command_center_result_id ?? null,
        policy_pack_id ?? null,
        now,
      ]
    )

    if (error) throw error
    const row = inserted?.[0]
    if (!row) throw new Error("Insert failed")

    const caseRow = {
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

    return Response.json({ success: true, data: caseRow })
  } catch (e) {
    console.error("Create review queue case error:", e)
    return Response.json({ success: false, error: "Failed to create case" }, { status: 500 })
  }
}
