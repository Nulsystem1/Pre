// Neo4j driver for knowledge graph operations
import neo4j, { Driver, Session } from "neo4j-driver"
import type { GraphNode, GraphEdge, NodeType, RelationshipType } from "./types"

let driver: Driver | null = null

// Initialize Neo4j driver
export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687"
    const user = process.env.NEO4J_USER || "neo4j"
    const password = process.env.NEO4J_PASSWORD || "neo4jpassword"

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
    })
  }

  return driver
}

// Close Neo4j driver
export async function closeNeo4jDriver() {
  if (driver) {
    await driver.close()
    driver = null
  }
}

// Get a session
export function getSession(): Session {
  return getNeo4jDriver().session()
}

// Helper function to get node label from node type
function getNodeLabel(nodeType: NodeType): string {
  const labelMap: Record<NodeType, string> = {
    threshold: "Threshold",
    condition: "Condition",
    action: "Action",
    entity_type: "EntityType",
    risk_factor: "RiskFactor",
    document_type: "DocumentType",
    jurisdiction: "Jurisdiction",
  }
  return labelMap[nodeType]
}

// Create a graph node in Neo4j
export async function createGraphNode(node: GraphNode): Promise<void> {
  const session = getSession()
  const label = getNodeLabel(node.node_type)

  try {
    await session.run(
      `
      CREATE (n:GraphNode:${label} {
        id: $id,
        policy_pack_id: $policy_pack_id,
        node_type: $node_type,
        label: $label_text,
        properties: $properties,
        source_text: $source_text,
        position_x: $position_x,
        position_y: $position_y
      })
      `,
      {
        id: node.id,
        policy_pack_id: node.policy_pack_id,
        node_type: node.node_type,
        label_text: node.label,
        properties: JSON.stringify(node.properties),
        source_text: node.source_text || null,
        position_x: node.position?.x || 0,
        position_y: node.position?.y || 0,
      }
    )
  } finally {
    await session.close()
  }
}

// Create multiple graph nodes in a transaction
export async function createGraphNodes(nodes: GraphNode[]): Promise<void> {
  const session = getSession()

  try {
    const tx = session.beginTransaction()

    for (const node of nodes) {
      const label = getNodeLabel(node.node_type)
      await tx.run(
        `
        CREATE (n:GraphNode:${label} {
          id: $id,
          policy_pack_id: $policy_pack_id,
          node_type: $node_type,
          label: $label_text,
          properties: $properties,
          source_text: $source_text,
          position_x: $position_x,
          position_y: $position_y
        })
        `,
        {
          id: node.id,
          policy_pack_id: node.policy_pack_id,
          node_type: node.node_type,
          label_text: node.label,
          properties: JSON.stringify(node.properties),
          source_text: node.source_text || null,
          position_x: node.position?.x || 0,
          position_y: node.position?.y || 0,
        }
      )
    }

    await tx.commit()
  } catch (error) {
    console.error("Error creating graph nodes:", error)
    throw error
  } finally {
    await session.close()
  }
}

// Create a graph edge in Neo4j
export async function createGraphEdge(edge: GraphEdge): Promise<void> {
  const session = getSession()

  try {
    await session.run(
      `
      MATCH (source:GraphNode {id: $source_node_id})
      MATCH (target:GraphNode {id: $target_node_id})
      CREATE (source)-[r:GRAPH_RELATIONSHIP {
        id: $id,
        policy_pack_id: $policy_pack_id,
        relationship: $relationship,
        properties: $properties
      }]->(target)
      `,
      {
        id: edge.id,
        source_node_id: edge.source_node_id,
        target_node_id: edge.target_node_id,
        policy_pack_id: edge.policy_pack_id,
        relationship: edge.relationship,
        properties: JSON.stringify(edge.properties || {}),
      }
    )
  } finally {
    await session.close()
  }
}

// Create multiple graph edges in a transaction
export async function createGraphEdges(edges: GraphEdge[]): Promise<void> {
  const session = getSession()

  try {
    const tx = session.beginTransaction()

    for (const edge of edges) {
      await tx.run(
        `
        MATCH (source:GraphNode {id: $source_node_id})
        MATCH (target:GraphNode {id: $target_node_id})
        CREATE (source)-[r:GRAPH_RELATIONSHIP {
          id: $id,
          policy_pack_id: $policy_pack_id,
          relationship: $relationship,
          properties: $properties
        }]->(target)
        `,
        {
          id: edge.id,
          source_node_id: edge.source_node_id,
          target_node_id: edge.target_node_id,
          policy_pack_id: edge.policy_pack_id,
          relationship: edge.relationship,
          properties: JSON.stringify(edge.properties || {}),
        }
      )
    }

    await tx.commit()
  } catch (error) {
    console.error("Error creating graph edges:", error)
    throw error
  } finally {
    await session.close()
  }
}

// Get all graph nodes for a policy pack
export async function getGraphNodes(policyPackId: string): Promise<GraphNode[]> {
  const session = getSession()

  try {
    const result = await session.run(
      `
      MATCH (n:GraphNode {policy_pack_id: $policy_pack_id})
      RETURN n
      ORDER BY n.label
      `,
      { policy_pack_id: policyPackId }
    )

    return result.records.map((record) => {
      const node = record.get("n")
      return {
        id: node.properties.id,
        policy_pack_id: node.properties.policy_pack_id,
        node_type: node.properties.node_type as NodeType,
        label: node.properties.label,
        properties: JSON.parse(node.properties.properties || "{}"),
        source_text: node.properties.source_text || undefined,
        position: {
          x: node.properties.position_x || 0,
          y: node.properties.position_y || 0,
        },
      }
    })
  } finally {
    await session.close()
  }
}

// Get all graph edges for a policy pack
export async function getGraphEdges(policyPackId: string): Promise<GraphEdge[]> {
  const session = getSession()

  try {
    const result = await session.run(
      `
      MATCH (source:GraphNode)-[r:GRAPH_RELATIONSHIP {policy_pack_id: $policy_pack_id}]->(target:GraphNode)
      RETURN r, source.id as source_id, target.id as target_id
      `,
      { policy_pack_id: policyPackId }
    )

    return result.records.map((record) => {
      const rel = record.get("r")
      return {
        id: rel.properties.id,
        policy_pack_id: rel.properties.policy_pack_id,
        source_node_id: record.get("source_id"),
        target_node_id: record.get("target_id"),
        relationship: rel.properties.relationship as RelationshipType,
        properties: JSON.parse(rel.properties.properties || "{}"),
      }
    })
  } finally {
    await session.close()
  }
}

// Get full graph (nodes + edges) for a policy pack
export async function getGraph(policyPackId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const nodes = await getGraphNodes(policyPackId)
  const edges = await getGraphEdges(policyPackId)
  return { nodes, edges }
}

// Delete all graph data for a policy pack
export async function deleteGraphByPolicyPack(policyPackId: string): Promise<void> {
  const session = getSession()

  try {
    await session.run(
      `
      MATCH (n:GraphNode {policy_pack_id: $policy_pack_id})
      DETACH DELETE n
      `,
      { policy_pack_id: policyPackId }
    )
  } finally {
    await session.close()
  }
}

// Initialize Neo4j constraints and indexes
export async function initializeNeo4j(): Promise<void> {
  const session = getSession()

  try {
    // Create unique constraint on node ID
    await session.run(`
      CREATE CONSTRAINT node_id_unique IF NOT EXISTS
      FOR (n:GraphNode) REQUIRE n.id IS UNIQUE
    `)

    // Create index on policy_pack_id
    await session.run(`
      CREATE INDEX node_policy_pack_idx IF NOT EXISTS
      FOR (n:GraphNode) ON (n.policy_pack_id)
    `)

    // Create index on node_type
    await session.run(`
      CREATE INDEX node_type_idx IF NOT EXISTS
      FOR (n:GraphNode) ON (n.node_type)
    `)

    // Create index on label
    await session.run(`
      CREATE INDEX node_label_idx IF NOT EXISTS
      FOR (n:GraphNode) ON (n.label)
    `)

    // Create unique constraint on edge ID
    await session.run(`
      CREATE CONSTRAINT edge_id_unique IF NOT EXISTS
      FOR ()-[r:GRAPH_RELATIONSHIP]-() REQUIRE r.id IS UNIQUE
    `)

    
  } catch (error) {
    console.error("Error initializing Neo4j:", error)
    throw error
  } finally {
    await session.close()
  }
}

