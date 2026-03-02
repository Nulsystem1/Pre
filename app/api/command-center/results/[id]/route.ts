import { query, deleteReviewQueueCasesByCommandCenterResultId } from "@/lib/supabase"

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const human_processed_at = body.human_processed_at ?? new Date().toISOString()

    const { data: rows, error } = await query(
      `UPDATE command_center_results
       SET human_processed_at = $1
       WHERE id = $2
       RETURNING id, event_type, event_data, outcome, confidence, risk_score, reasoning,
                 matched_policies, recommended_actions, missing_information,
                 policy_pack_id, policy_pack_name, policy_version, validated_at, human_processed_at, agent_metadata`,
      [human_processed_at, id]
    )
    if (error) throw error
    const row = rows?.[0]
    if (!row) {
      return Response.json({ success: false, error: "Result not found" }, { status: 404 })
    }
    return Response.json({ success: true, data: rowToResult(row) })
  } catch (e) {
    console.error("Update command center result error:", e)
    return Response.json({ success: false, error: "Failed to update result" }, { status: 500 })
  }
}

/** DELETE a single result; cascade-deletes any review queue cases linked to this result */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteReviewQueueCasesByCommandCenterResultId(id)
    const { data: rows, error } = await query(
      "DELETE FROM command_center_results WHERE id = $1 RETURNING id",
      [id]
    )
    if (error) throw error
    if (!rows?.length) {
      return Response.json({ success: false, error: "Result not found" }, { status: 404 })
    }
    return Response.json({ success: true, data: { id } })
  } catch (e) {
    console.error("Delete command center result error:", e)
    return Response.json({ success: false, error: "Failed to delete result" }, { status: 500 })
  }
}
