import { graphNodes, graphEdges } from "@/lib/store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const policyPackId = searchParams.get("policyPackId")

  const nodes = policyPackId ? graphNodes.filter((n) => n.policy_pack_id === policyPackId) : graphNodes

  const edges = policyPackId ? graphEdges.filter((e) => e.policy_pack_id === policyPackId) : graphEdges

  return Response.json({
    success: true,
    data: { nodes, edges },
  })
}
