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
  source_node_ids TEXT[] DEFAULT '{}',
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(policy_pack_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_controls_policy_pack ON controls(policy_pack_id);
CREATE INDEX IF NOT EXISTS idx_controls_enabled ON controls(enabled);

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
