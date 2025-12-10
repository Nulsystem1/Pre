// NUL Compliance Control Center - Neo4j Initialization Script
// This script creates constraints and indexes for the knowledge graph

// ============================================
// Constraints for Graph Nodes
// ============================================

// Ensure unique node IDs
CREATE CONSTRAINT node_id_unique IF NOT EXISTS
FOR (n:GraphNode) REQUIRE n.id IS UNIQUE;

// Ensure policy pack ID exists
CREATE CONSTRAINT node_policy_pack_id IF NOT EXISTS
FOR (n:GraphNode) REQUIRE n.policy_pack_id IS NOT NULL;

// ============================================
// Indexes for Performance
// ============================================

// Index on policy_pack_id for filtering
CREATE INDEX node_policy_pack_idx IF NOT EXISTS
FOR (n:GraphNode) ON (n.policy_pack_id);

// Index on node_type for filtering
CREATE INDEX node_type_idx IF NOT EXISTS
FOR (n:GraphNode) ON (n.node_type);

// Index on label for search
CREATE INDEX node_label_idx IF NOT EXISTS
FOR (n:GraphNode) ON (n.label);

// ============================================
// Constraints for Graph Edges
// ============================================

// Ensure unique edge IDs
CREATE CONSTRAINT edge_id_unique IF NOT EXISTS
FOR ()-[r:GRAPH_RELATIONSHIP]-() REQUIRE r.id IS UNIQUE;

// ============================================
// Node Type Labels (for better query performance)
// ============================================
// We'll use dynamic labels for node types:
// - :Threshold
// - :Condition
// - :Action
// - :EntityType
// - :RiskFactor
// - :DocumentType
// - :Jurisdiction

// These will be added dynamically when creating nodes
// Example: A node with node_type="threshold" will have labels [:GraphNode, :Threshold]

// ============================================
// Sample Queries (commented out - for reference)
// ============================================

// Find all nodes for a policy pack:
// MATCH (n:GraphNode {policy_pack_id: $policyPackId})
// RETURN n

// Find all edges between nodes in a policy pack:
// MATCH (source:GraphNode {policy_pack_id: $policyPackId})-[r]->(target:GraphNode {policy_pack_id: $policyPackId})
// RETURN source, r, target

// Find paths from conditions to actions:
// MATCH path = (c:Condition {policy_pack_id: $policyPackId})-[*1..3]->(a:Action {policy_pack_id: $policyPackId})
// RETURN path

// Delete all nodes for a policy pack (cascade delete):
// MATCH (n:GraphNode {policy_pack_id: $policyPackId})
// DETACH DELETE n

