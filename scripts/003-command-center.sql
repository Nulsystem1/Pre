-- Command Center: Queue-based agentic decision processing
-- This migration adds pending_decisions table and updates existing tables

-- 1. Create pending_decisions table
CREATE TABLE IF NOT EXISTS pending_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  policy_pack_id UUID REFERENCES policy_packs(id),
  source VARCHAR(100) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Agent processing metadata
  agent_attempts INTEGER DEFAULT 0,
  agent_queries_used TEXT[],
  processing_error TEXT,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low'))
);

-- Indexes for performance
CREATE INDEX idx_pending_decisions_status ON pending_decisions(status);
CREATE INDEX idx_pending_decisions_created_at ON pending_decisions(created_at DESC);
CREATE INDEX idx_pending_decisions_priority ON pending_decisions(priority);
CREATE INDEX idx_pending_decisions_policy_pack ON pending_decisions(policy_pack_id);

-- 2. Update decisions table with agent metadata
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS pending_decision_id UUID REFERENCES pending_decisions(id),
  ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS agent_attempts INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_search_queries TEXT[];

-- 3. Rename cases to review_items (if not already done)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cases') THEN
    ALTER TABLE cases RENAME TO review_items;
  END IF;
END $$;

-- 4. Update review_items with agent routing info
ALTER TABLE review_items
  ADD COLUMN IF NOT EXISTS decision_id UUID REFERENCES decisions(id),
  ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS missing_information TEXT[],
  ADD COLUMN IF NOT EXISTS auto_routed BOOLEAN DEFAULT false;

-- 5. Create view for command center stats
CREATE OR REPLACE VIEW command_center_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'completed' AND DATE(processed_at) = CURRENT_DATE) as completed_today,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE priority = 'high' AND status = 'pending') as high_priority_pending,
  ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at)) / 60), 2) as avg_processing_time_minutes
FROM pending_decisions
WHERE created_at > NOW() - INTERVAL '7 days';

-- 6. Comments for documentation
COMMENT ON TABLE pending_decisions IS 'Queue of events waiting for agentic processing';
COMMENT ON COLUMN pending_decisions.agent_attempts IS 'Number of times agent tried to process (max 3)';
COMMENT ON COLUMN pending_decisions.agent_queries_used IS 'Search queries agent used for RAG retrieval';
COMMENT ON TABLE review_items IS 'Items requiring human review (low confidence or flagged)';
COMMENT ON COLUMN review_items.auto_routed IS 'True if agent automatically sent here due to low confidence';

