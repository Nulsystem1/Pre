-- Add policy_pack_id to review_queue_cases (for existing DBs that ran 005 before this column existed)
ALTER TABLE review_queue_cases ADD COLUMN IF NOT EXISTS policy_pack_id UUID REFERENCES policy_packs(id) ON DELETE SET NULL;
