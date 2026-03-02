import { query } from "@/lib/supabase"

function rowToResult(row: Record<string, unknown>) {
  return {
    id: row.id,
    event_type: row.event_type,
    event_data: (typeof row.event_data === "object" && row.event_data !== null) ? row.event_data : {},
    outcome: row.outcome,
    confidence: Number(row.confidence),
    risk_score: Number(row.risk_score),
    reasoning: String(row.reasoning ?? ""),
    matched_policies: Array.isArray(row.matched_policies) ? row.matched_policies : [],
    recommended_actions: Array.isArray(row.recommended_actions) ? row.recommended_actions : undefined,
    missing_information: Array.isArray(row.missing_information) ? row.missing_information : undefined,
    policy_pack_id: row.policy_pack_id,
    policy_pack_name: row.policy_pack_name,
    policy_version: row.policy_version,
    validated_at: row.validated_at,
    human_processed_at: row.human_processed_at ?? undefined,
    agent_metadata: typeof row.agent_metadata === "object" && row.agent_metadata !== null ? row.agent_metadata as Record<string, unknown> : undefined,
  }
}

export async function GET() {
  try {
    const { data: rows, error } = await query(
      `SELECT id, event_type, event_data, outcome, confidence, risk_score, reasoning,
              matched_policies, recommended_actions, missing_information,
              policy_pack_id, policy_pack_name, policy_version, validated_at, human_processed_at, agent_metadata
       FROM command_center_results
       ORDER BY validated_at DESC`
    )
    if (error) {
      if ((error as { code?: string }).code === "42P01") {
        return Response.json({ success: true, data: [] })
      }
      throw error
    }
    const results = (rows ?? []).map(rowToResult)
    return Response.json({ success: true, data: results })
  } catch (e) {
    console.error("Get command center results error:", e)
    return Response.json({ success: false, error: "Failed to load results" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const results = Array.isArray(body.results) ? body.results : [body]
    if (results.length === 0) {
      return Response.json({ success: false, error: "No results to save" }, { status: 400 })
    }

    const saved: Record<string, unknown>[] = []
    for (const r of results) {
      const { data: insertData, error } = await query(
        `INSERT INTO command_center_results (
          event_type, event_data, outcome, confidence, risk_score, reasoning,
          matched_policies, recommended_actions, missing_information,
          policy_pack_id, policy_pack_name, policy_version, validated_at, human_processed_at, agent_metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, event_type, event_data, outcome, confidence, risk_score, reasoning,
                  matched_policies, recommended_actions, missing_information,
                  policy_pack_id, policy_pack_name, policy_version, validated_at, human_processed_at, agent_metadata`,
        [
          r.event_type,
          JSON.stringify(r.event_data ?? {}),
          r.outcome,
          Number(r.confidence),
          Number(r.risk_score),
          String(r.reasoning ?? ""),
          JSON.stringify(r.matched_policies ?? []),
          JSON.stringify(r.recommended_actions ?? []),
          JSON.stringify(r.missing_information ?? []),
          r.policy_pack_id,
          r.policy_pack_name ?? "",
          r.policy_version ?? "1.0",
          r.validated_at ?? new Date().toISOString(),
          r.human_processed_at ?? null,
          r.agent_metadata ? JSON.stringify(r.agent_metadata) : null,
        ]
      )
      if (error) throw error
      const row = insertData?.[0]
      if (row) saved.push(rowToResult(row))
    }
    return Response.json({ success: true, data: saved })
  } catch (e) {
    console.error("Save command center results error:", e)
    const code = (e as { code?: string }).code
    if (code === "42P01") {
      return Response.json({
        success: false,
        error: "Table command_center_results does not exist. Run: bash scripts/setup.sh (or from Git Bash: docker compose exec -T postgres psql -U postgres -d postgres < scripts/004-command-center-results.sql)",
      }, { status: 503 })
    }
    return Response.json({ success: false, error: "Failed to save results" }, { status: 500 })
  }
}
