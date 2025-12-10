import { z } from "zod"
import { updatePolicyPack, createPolicyChunks, getPolicyPackById } from "@/lib/supabase"
import { createGraphNodes, createGraphEdges, deleteGraphByPolicyPack } from "@/lib/neo4j"
import { generateEmbeddings } from "@/lib/embeddings"
import { generateStructuredOutput } from "@/lib/openai-client"
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

// Schema for extracting graph nodes (Step 1)
const nodesSchema = z.object({
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
})

// Schema for extracting edges (Step 2)
const edgesSchema = z.object({
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
    const pack = await getPolicyPackById(policyPackId)
    if (!pack) {
      return Response.json({ success: false, error: "Policy pack not found" }, { status: 404 })
    }
    await updatePolicyPack(policyPackId, { raw_content: policyText })

    // Step 1: Extract chunks using AI (Linear RAG preparation)
    const chunksResult = await generateStructuredOutput({
      model: "gpt-5.1-2025-11-13",
      schema: chunksSchema,
      prompt: `You are a compliance policy analyst. Extract structured chunks from the following policy document.
Each chunk should represent a single policy requirement or rule that could be turned into a control.

Policy Document:
${policyText}

Extract each distinct rule or requirement as a separate chunk with its section reference, priority, and primary action type.`,
      maxTokens: 4000,
    })

    // Generate embeddings for chunks
    const chunksWithEmbeddings = await generateEmbeddings(
      chunksResult.chunks.map((c) => c.content)
    )

    // Store chunks in Supabase
    const newChunks = await createPolicyChunks(
      chunksResult.chunks.map((chunk, i) => ({
        policy_pack_id: policyPackId,
        content: chunk.content,
        section_ref: chunk.section_ref,
        embedding: chunksWithEmbeddings[i],
        metadata: {
          priority: chunk.priority,
          action_type: chunk.action_type,
        },
      }))
    )

    // Step 2a: Extract graph nodes first (simpler, more reliable)
    const nodesResult = await generateStructuredOutput({
      model: "gpt-5.1-2025-11-13",
      schema: nodesSchema,
      maxTokens: 4000,
      prompt: `You are a compliance policy analyst. Extract key entities from this policy document.

Focus on identifying:
1. **Thresholds**: Numeric rules (e.g., "amount > $100,000", "risk score > 50")
2. **Conditions**: Requirements or checks (e.g., "ID verified", "sanctions check clear", "business exists")
3. **Actions**: Outcomes (e.g., "BLOCK", "REVIEW", "APPROVE")
4. **Entity types**: Types of subjects (e.g., "vendor", "PEP", "sanctioned entity")
5. **Risk factors**: Risk indicators (e.g., "high-risk country", "adverse media")
6. **Document types**: Required documents (e.g., "W-9 form", "insurance certificate")
7. **Jurisdictions**: Geographic areas (e.g., "domestic", "international", "embargoed country")

Policy Document:
${policyText}

Extract 15-25 of the most important entities. Each node should be distinct and actionable.`,
    })

    // Step 2b: Extract relationships between the nodes
    const edgesResult = await generateStructuredOutput({
      model: "gpt-5.1-2025-11-13",
      schema: edgesSchema,
      maxTokens: 2000,
      prompt: `Given these nodes extracted from a compliance policy, identify relationships between them.

Nodes:
${nodesResult.nodes.map((n, i) => `${i}. [${n.node_type}] ${n.label}`).join('\n')}

Relationship types:
- TRIGGERS: A condition/threshold triggers an action
- CASCADES_TO: One check leads to another check
- REQUIRES: An action/entity requires documentation
- OVERRIDES: One rule overrides another
- APPLIES_TO: A rule applies to specific entity types
- EXEMPTS: A condition exempts from rules

Identify 10-20 key relationships. Use node indices (0-${nodesResult.nodes.length - 1}) for source_index and target_index.

Example: If node 5 "amount > $100k" TRIGGERS node 12 "BLOCK", create: {source_index: 5, target_index: 12, relationship: "TRIGGERS"}`,
    })

    const graphResult = {
      nodes: nodesResult.nodes,
      edges: edgesResult.edges,
    }

    // Store graph nodes with positions
    const newNodes: GraphNode[] = graphResult.nodes.map((node, i) => ({
      id: `node-${policyPackId}-${Date.now()}-${i}`,
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
    const newEdges: GraphEdge[] = graphResult.edges.map((edge, i) => ({
      id: `edge-${policyPackId}-${Date.now()}-${i}`,
      policy_pack_id: policyPackId,
      source_node_id: newNodes[edge.source_index]?.id || "",
      target_node_id: newNodes[edge.target_index]?.id || "",
      relationship: edge.relationship,
    }))

    // Delete old graph data for this pack in Neo4j
    await deleteGraphByPolicyPack(policyPackId)

    // Create new nodes and edges in Neo4j
    await createGraphNodes(newNodes)
    await createGraphEdges(newEdges)

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
