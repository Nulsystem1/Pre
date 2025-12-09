import { generateObject } from "ai"
import { z } from "zod"
import { policyPacks, policyChunks, graphNodes, graphEdges } from "@/lib/store"
import type { GraphNode, GraphEdge, PolicyChunk } from "@/lib/types"

// Schema for extracting policy chunks
const chunksSchema = z.object({
  chunks: z.array(
    z.object({
      content: z.string().describe("The policy text content for this chunk"),
      section_ref: z.string().describe("Section reference like 'Section 1: Identity Verification'"),
      priority: z.enum(["critical", "high", "medium", "low"]).describe("Priority level of this policy requirement"),
      action_type: z.enum(["block", "review", "request_docs", "approve", "escalate"]).describe("Primary action type"),
    }),
  ),
})

// Schema for extracting graph entities and relationships
const graphSchema = z.object({
  nodes: z.array(
    z.object({
      node_type: z
        .enum(["threshold", "entity_type", "action", "condition", "risk_factor", "document_type", "jurisdiction"])
        .describe("Type of node"),
      label: z.string().describe("Human-readable label for the node"),
      properties: z
        .object({
          field: z.string().optional().describe("Data field this applies to"),
          operator: z.string().optional().describe("Comparison operator"),
          value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
          action_type: z.enum(["APPROVE", "REVIEW", "BLOCK"]).optional(),
          severity: z.enum(["critical", "high", "medium", "low"]).optional(),
        })
        .passthrough(),
      source_text: z.string().describe("Original policy text this node was extracted from"),
    }),
  ),
  edges: z.array(
    z.object({
      source_index: z.number().describe("Index of source node in nodes array"),
      target_index: z.number().describe("Index of target node in nodes array"),
      relationship: z.enum(["TRIGGERS", "CASCADES_TO", "REQUIRES", "OVERRIDES", "APPLIES_TO", "EXEMPTS"]),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { policyPackId, policyText } = await req.json()

    if (!policyPackId || !policyText) {
      return Response.json({ success: false, error: "Missing policyPackId or policyText" }, { status: 400 })
    }

    // Update policy pack with raw content
    const packIndex = policyPacks.findIndex((p) => p.id === policyPackId)
    if (packIndex === -1) {
      return Response.json({ success: false, error: "Policy pack not found" }, { status: 404 })
    }
    policyPacks[packIndex].raw_content = policyText

    // Step 1: Extract chunks using AI (Linear RAG preparation)
    const chunksResult = await generateObject({
      model: "anthropic/claude-sonnet-4-20250514",
      schema: chunksSchema,
      prompt: `You are a compliance policy analyst. Extract structured chunks from the following policy document.
Each chunk should represent a single policy requirement or rule that could be turned into a control.

Policy Document:
${policyText}

Extract each distinct rule or requirement as a separate chunk with its section reference, priority, and primary action type.`,
      maxOutputTokens: 4000,
    })

    // Store chunks
    const newChunks: PolicyChunk[] = chunksResult.object.chunks.map((chunk, i) => ({
      id: `chunk-${policyPackId}-${i}`,
      policy_pack_id: policyPackId,
      content: chunk.content,
      section_ref: chunk.section_ref,
      embedding: null, // Would be generated via embedding API in production
      metadata: {
        priority: chunk.priority,
        action_type: chunk.action_type,
      },
    }))

    // Remove old chunks for this pack and add new ones
    const existingChunkIndices = policyChunks
      .map((c, i) => (c.policy_pack_id === policyPackId ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
    existingChunkIndices.forEach((i) => policyChunks.splice(i, 1))
    policyChunks.push(...newChunks)

    // Step 2: Extract graph entities and relationships (Graph RAG)
    const graphResult = await generateObject({
      model: "anthropic/claude-sonnet-4-20250514",
      schema: graphSchema,
      prompt: `You are a compliance policy analyst building a knowledge graph. Extract entities and relationships from the following policy document.

Entity types:
- threshold: Numeric thresholds (e.g., "risk score > 50", "age < 18", "amount > 10000")
- entity_type: Types of entities being monitored (e.g., "PEP", "sanctioned entity", "business account")
- action: Actions to take (e.g., "block", "review", "escalate", "request documentation")
- condition: Boolean conditions (e.g., "ID not verified", "address not verified")
- risk_factor: Risk indicators (e.g., "high-risk country", "unusual transaction pattern")
- document_type: Required documents (e.g., "proof of address", "source of funds")
- jurisdiction: Geographic/regulatory jurisdictions

Relationships:
- TRIGGERS: Condition/threshold leads to an action
- CASCADES_TO: One condition leads to another check
- REQUIRES: An entity/condition requires specific documentation
- OVERRIDES: One rule overrides another
- APPLIES_TO: A rule applies to specific entity types
- EXEMPTS: A condition exempts from certain rules

Policy Document:
${policyText}

Extract all entities and their relationships. Be thorough - capture all thresholds, conditions, and actions mentioned.`,
      maxOutputTokens: 4000,
    })

    // Store graph nodes with positions
    const newNodes: GraphNode[] = graphResult.object.nodes.map((node, i) => ({
      id: `node-${policyPackId}-${i}`,
      policy_pack_id: policyPackId,
      node_type: node.node_type,
      label: node.label,
      properties: node.properties,
      source_text: node.source_text,
      position: {
        x: 100 + (i % 4) * 200,
        y: 100 + Math.floor(i / 4) * 150,
      },
    }))

    // Store graph edges
    const newEdges: GraphEdge[] = graphResult.object.edges.map((edge, i) => ({
      id: `edge-${policyPackId}-${i}`,
      policy_pack_id: policyPackId,
      source_node_id: newNodes[edge.source_index]?.id || "",
      target_node_id: newNodes[edge.target_index]?.id || "",
      relationship: edge.relationship,
    }))

    // Remove old graph data for this pack
    const existingNodeIndices = graphNodes
      .map((n, i) => (n.policy_pack_id === policyPackId ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
    existingNodeIndices.forEach((i) => graphNodes.splice(i, 1))
    graphNodes.push(...newNodes)

    const existingEdgeIndices = graphEdges
      .map((e, i) => (e.policy_pack_id === policyPackId ? i : -1))
      .filter((i) => i >= 0)
      .reverse()
    existingEdgeIndices.forEach((i) => graphEdges.splice(i, 1))
    graphEdges.push(...newEdges)

    return Response.json({
      success: true,
      data: {
        policy_pack_id: policyPackId,
        chunks_created: newChunks.length,
        graph_nodes_created: newNodes.length,
        graph_edges_created: newEdges.length,
      },
    })
  } catch (error) {
    console.error("Policy ingestion error:", error)
    return Response.json({ success: false, error: "Failed to ingest policy" }, { status: 500 })
  }
}
