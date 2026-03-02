-- Review Queue Cases: structured cases from Command Center (human review)
-- Template: case_id, status (IN_REVIEW | ESCALATED | NEEDS_INFO | FINALIZED), validation_result, attachments, audit_log
CREATE TABLE IF NOT EXISTS review_queue_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'IN_REVIEW'
    CHECK (status IN ('IN_REVIEW', 'ESCALATED', 'NEEDS_INFO', 'FINALIZED')),
  assigned_to TEXT,
  validation_result JSONB NOT NULL DEFAULT '{}',
  attachments JSONB NOT NULL DEFAULT '[]',
  audit_log JSONB NOT NULL DEFAULT '[]',
  structured_edits JSONB DEFAULT '{}',
  command_center_result_id TEXT,
  policy_pack_id UUID REFERENCES policy_packs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_queue_cases_status ON review_queue_cases(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_cases_assigned_to ON review_queue_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_review_queue_cases_created_at ON review_queue_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_queue_cases_case_id ON review_queue_cases(case_id);

COMMENT ON TABLE review_queue_cases IS 'Human review cases from Command Center; validation_result + attachments + audit_log';
