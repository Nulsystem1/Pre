-- Add optional display name to review queue cases (unique id remains case_id)
ALTER TABLE review_queue_cases ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN review_queue_cases.name IS 'User-facing case name; case_id remains the unique identifier';
