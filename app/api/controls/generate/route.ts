import { generateObject } from "ai"
import { z } from "zod"
import { getPolicyPackById, getPolicyChunks, createControls, deleteControlsByPolicyPack } from "@/lib/supabase"
import { getGraph } from "@/lib/neo4j"
import type { Control, JSONLogicCondition } from "@/lib/types"

// Schema for generating controls from graph traversal
const controlsSchema = z.object({
  controls: z.array(
    z.object({
      control_id: z.string().describe("Unique control ID like KYC-001, AML-002"),
      name: z.string().describe("Human-readable name for the control"),
      description: z.string().describe("Brief description of what this control checks"),
      condition_json: z.object({}).passthrough().describe("JSON Logic condition object"),
      condition_readable: z.string().describe("Human-readable condition string"),
      action: z.enum(["APPROVE", "REVIEW", "BLOCK"]).describe("Action to take when condition matches"),
      risk_weight: z.number().min(0).max(1).describe("Risk weight from 0.0 to 1.0"),
      ai_reasoning: z.string().describe("Explanation of why this control was generated from the policy"),
      source_node_labels: z.array(z.string()).describe("Labels of graph nodes this control was derived from"),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const { policyPackId } = await req.json()

    if (!policyPackId) {
      return Response.json({ success: false, error: "Missing policyPackId" }, { status: 400 })
    }

    // Get policy pack
    const pack = await getPolicyPackById(policyPackId)
    if (!pack) {
      return Response.json({ success: false, error: "Policy pack not found" }, { status: 404 })
    }

    // Get graph data from Neo4j
    const { nodes, edges } = await getGraph(policyPackId)

    // Get policy chunks from Supabase
    const chunks = await getPolicyChunks(policyPackId)

    // Build graph context for LLM
    const graphContext = nodes
      .map((n) => {
        const outgoingEdges = edges.filter((e) => e.source_node_id === n.id)
        const incomingEdges = edges.filter((e) => e.target_node_id === n.id)

        const outgoing = outgoingEdges
          .map((e) => {
            const target = nodes.find((t) => t.id === e.target_node_id)
            return `  --[${e.relationship}]--> "${target?.label}"`
          })
          .join("\n")

        const incoming = incomingEdges
          .map((e) => {
            const source = nodes.find((s) => s.id === e.source_node_id)
            return `  <--[${e.relationship}]-- "${source?.label}"`
          })
          .join("\n")

        return `Node: "${n.label}" (type: ${n.node_type})
  Properties: ${JSON.stringify(n.properties)}
  Source: "${n.source_text}"
${outgoing ? `Outgoing:\n${outgoing}` : ""}
${incoming ? `Incoming:\n${incoming}` : ""}`
      })
      .join("\n\n")

    const chunksContext = chunks.map((c) => `[${c.section_ref}]: ${c.content}`).join("\n\n")

    // Generate controls using AI with graph context
    const result = await generateObject({
      model: "openai/gpt-4o",
      schema: controlsSchema,
      prompt: `You are a compliance control engineer. Generate executable JSON Logic controls from the following policy knowledge graph.

POLICY KNOWLEDGE GRAPH:
${graphContext}

POLICY TEXT CHUNKS:
${chunksContext}

For each path in the graph that leads from a condition/threshold to an action, generate a control.

JSON Logic format examples:
- Simple equality: {"==": [{"var": "customer.id_verified"}, false]}
- Greater than: {">": [{"var": "customer.risk_score"}, 50]}
- AND condition: {"and": [{">": [{"var": "amount"}, 10000]}, {"==": [{"var": "type"}, "wire"]}]}
- OR condition: {"or": [{"==": [{"var": "country"}, "IR"]}, {"==": [{"var": "country"}, "KP"]}]}
- IN array: {"in": [{"var": "customer.country"}, ["IR", "KP", "SY", "CU"]]}

Available data fields for conditions:
- customer.id_verified (boolean)
- customer.address_verified (boolean)
- customer.age (number)
- customer.risk_score (number, 0-100)
- customer.country (string, ISO code)
- customer.is_pep (boolean)
- customer.pep_match_confidence (number, 0-1)
- customer.account_type ("personal" | "business")
- transaction.amount (number)
- transaction.type ("wire_transfer" | "card_payment" | "ach" | "internal")
- transaction.destination_country (string)
- transaction.currency (string)

Generate comprehensive controls that:
1. Cover all action nodes in the graph
2. Combine conditions that lead to the same action
3. Use appropriate risk weights based on severity
4. Include clear reasoning tied to policy text

Use control IDs that match the policy pack type (e.g., KYC-001, AML-001, SANCT-001).`,
      maxOutputTokens: 4000,
    })

    // Map generated controls to our format
    const controlsToCreate = result.object.controls.map((ctrl) => ({
      policy_pack_id: policyPackId,
      control_id: ctrl.control_id,
      name: ctrl.name,
      description: ctrl.description,
      condition: ctrl.condition_json as JSONLogicCondition,
      condition_readable: ctrl.condition_readable,
      action: ctrl.action,
      risk_weight: ctrl.risk_weight,
      enabled: true,
      source_node_ids: nodes.filter((n) => ctrl.source_node_labels.includes(n.label)).map((n) => n.id),
      ai_reasoning: ctrl.ai_reasoning,
    }))

    // Remove old controls for this pack from Supabase
    await deleteControlsByPolicyPack(policyPackId)

    // Add new controls to Supabase
    const newControls = await createControls(controlsToCreate)

    return Response.json({
      success: true,
      data: {
        controls_generated: newControls.length,
        controls: newControls,
      },
    })
  } catch (error) {
    console.error("Control generation error:", error)
    return Response.json({ success: false, error: "Failed to generate controls" }, { status: 500 })
  }
}
