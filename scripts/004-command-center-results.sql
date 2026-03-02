-- Command Center Results: saved validation outcomes from Command Center / evaluate-agentic
-- Linked to review_queue_cases via command_center_result_id (TEXT = id::text)
CREATE TABLE IF NOT EXISTS command_center_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  outcome TEXT NOT NULL CHECK (outcome IN ('APPROVED', 'BLOCKED', 'REVIEW')),
  confidence DECIMAL(3,2) NOT NULL,
  risk_score INTEGER NOT NULL,
  reasoning TEXT NOT NULL DEFAULT '',
  matched_policies JSONB NOT NULL DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  missing_information JSONB DEFAULT '[]',
  policy_pack_id UUID REFERENCES policy_packs(id) ON DELETE SET NULL,
  policy_pack_name TEXT NOT NULL DEFAULT '',
  policy_version TEXT NOT NULL DEFAULT '1.0',
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  human_processed_at TIMESTAMPTZ,
  agent_metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_command_center_results_validated_at ON command_center_results(validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_center_results_outcome ON command_center_results(outcome);
CREATE INDEX IF NOT EXISTS idx_command_center_results_policy_pack ON command_center_results(policy_pack_id);

COMMENT ON TABLE command_center_results IS 'Saved validation results from Command Center; source for Audit Explorer and Review Queue cases';
