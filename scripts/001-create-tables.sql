-- NUL Compliance Control Center Database Schema
-- Run this script to set up Supabase tables

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Policy Packs Table
-- ============================================
CREATE TABLE IF NOT EXISTS policy_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'archived')),
  raw_content TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  UNIQUE(name, version)
);

-- ============================================
-- Policy Chunks Table (for Linear RAG)
-- ============================================
CREATE TABLE IF NOT EXISTS policy_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_pack_id UUID NOT NULL REFERENCES policy_packs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  section_ref TEXT,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_chunks_policy_pack ON policy_chunks(policy_pack_id);
CREATE INDEX IF NOT EXISTS idx_policy_chunks_embedding ON policy_chunks USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- Execution Targets Table
-- ============================================
CREATE TABLE IF NOT EXISTS execution_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Task', 'Webhook', 'AgentStub')),
  description TEXT,
  integration_label TEXT,
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_targets_enabled ON execution_targets(enabled);

-- ============================================
-- Controls Table
-- ============================================
CREATE TABLE IF NOT EXISTS controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_pack_id UUID NOT NULL REFERENCES policy_packs(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition JSONB NOT NULL,
  condition_readable TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('APPROVE', 'REVIEW', 'BLOCK')),
  risk_weight NUMERIC DEFAULT 1.0,
  enabled BOOLEAN DEFAULT true,
  execution_target_id UUID REFERENCES execution_targets(id) ON DELETE SET NULL,
  confidence_threshold NUMERIC DEFAULT 0.8,
  source_node_ids TEXT[] DEFAULT '{}',
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(policy_pack_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_controls_policy_pack ON controls(policy_pack_id);
CREATE INDEX IF NOT EXISTS idx_controls_enabled ON controls(enabled);
CREATE INDEX IF NOT EXISTS idx_controls_execution_target ON controls(execution_target_id);

-- ============================================
-- Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('ONBOARDING', 'TRANSACTION', 'ACCOUNT_UPDATE', 'KYC_REFRESH')),
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_received_at ON events(received_at DESC);

-- ============================================
-- Decisions Table (Immutable Audit Log)
-- ============================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  control_id UUID REFERENCES controls(id),
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REVIEW', 'BLOCKED')),
  risk_score NUMERIC,
  matched_conditions JSONB,
  ai_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  policy_pack_version TEXT NOT NULL,
  control_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_decisions_event ON decisions(event_id);
CREATE INDEX IF NOT EXISTS idx_decisions_decision ON decisions(decision);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);

-- Make decisions table append-only (no updates or deletes for audit compliance)
CREATE OR REPLACE FUNCTION prevent_decision_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Decisions table is append-only for audit compliance';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decisions_immutable ON decisions;
CREATE TRIGGER decisions_immutable
  BEFORE UPDATE OR DELETE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_decision_modification();

-- ============================================
-- Cases Table
-- ============================================
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
  resolution TEXT CHECK (resolution IN ('approved', 'blocked', 'escalated') OR resolution IS NULL),
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_customer ON cases(customer_id);

-- ============================================
-- Review Items Table (for low-confidence decisions)
-- ============================================
CREATE TABLE IF NOT EXISTS review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id),
  event_id UUID NOT NULL REFERENCES events(id),
  control_id UUID REFERENCES controls(id),
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  confidence_score NUMERIC NOT NULL,
  recommended_action TEXT NOT NULL,
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'overridden', 'escalated')),
  reviewer_action TEXT CHECK (reviewer_action IN ('approve', 'override', 'escalate') OR reviewer_action IS NULL),
  reviewer_notes TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_review_items_status ON review_items(status);
CREATE INDEX IF NOT EXISTS idx_review_items_decision ON review_items(decision_id);
CREATE INDEX IF NOT EXISTS idx_review_items_created_at ON review_items(created_at DESC);

-- ============================================
-- Audit Events Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor TEXT,
  document_id UUID REFERENCES policy_packs(id),
  rule_id UUID REFERENCES controls(id),
  review_item_id UUID REFERENCES review_items(id),
  decision_id UUID REFERENCES decisions(id),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_document ON audit_events(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_rule ON audit_events(rule_id);

-- ============================================
-- Graph Nodes Table (for Graph RAG - stored in Supabase as backup)
-- Primary graph storage is in Neo4j
-- ============================================
CREATE TABLE IF NOT EXISTS graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_pack_id UUID NOT NULL REFERENCES policy_packs(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  source_text TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_policy_pack ON graph_nodes(policy_pack_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(node_type);

-- ============================================
-- Graph Edges Table
-- ============================================
CREATE TABLE IF NOT EXISTS graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_pack_id UUID NOT NULL REFERENCES policy_packs(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_policy_pack ON graph_edges(policy_pack_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_node_id);

-- ============================================
-- Unified Auth Tokens Table (Email Verify + Password Reset)
-- ============================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('VERIFY_EMAIL', 'RESET_PASSWORD')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_type_email ON auth_tokens(type, email);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_unused ON auth_tokens(used_at);
