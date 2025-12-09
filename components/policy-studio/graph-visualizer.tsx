"use client"

import { useEffect, useRef, useState } from "react"
import useSWR, { mutate } from "swr"
import * as d3 from "d3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2, GitBranch } from "lucide-react"
import type { GraphNode, GraphEdge, NodeType, RelationshipType } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Node type colors
const nodeColors: Record<NodeType, string> = {
  threshold: "#f59e0b", // amber
  entity_type: "#8b5cf6", // violet
  action: "#ef4444", // red
  condition: "#3b82f6", // blue
  risk_factor: "#f97316", // orange
  document_type: "#06b6d4", // cyan
  jurisdiction: "#10b981", // emerald
}

// Relationship colors
const edgeColors: Record<RelationshipType, string> = {
  TRIGGERS: "#ef4444",
  CASCADES_TO: "#f59e0b",
  REQUIRES: "#3b82f6",
  OVERRIDES: "#8b5cf6",
  APPLIES_TO: "#10b981",
  EXEMPTS: "#6b7280",
}

interface GraphVisualizerProps {
  policyPackId: string | null
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string
  label: string
  node_type: NodeType
  properties: Record<string, unknown>
  source_text?: string
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string
  relationship: RelationshipType
}

export function GraphVisualizer({ policyPackId }: GraphVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isAddingEdge, setIsAddingEdge] = useState(false)
  const [newNodeData, setNewNodeData] = useState({
    label: "",
    node_type: "condition" as NodeType,
    source_text: "",
  })
  const [newEdgeData, setNewEdgeData] = useState({
    source_node_id: "",
    target_node_id: "",
    relationship: "TRIGGERS" as RelationshipType,
  })

  const { data, isLoading } = useSWR(policyPackId ? `/api/graph?policyPackId=${policyPackId}` : null, fetcher)

  const nodes: GraphNode[] = data?.data?.nodes || []
  const edges: GraphEdge[] = data?.data?.edges || []

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = 500

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svg.call(zoom)

    const g = svg.append("g")

    // Prepare data for D3
    const d3Nodes: D3Node[] = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      node_type: n.node_type,
      properties: n.properties,
      source_text: n.source_text,
      x: n.position?.x || width / 2,
      y: n.position?.y || height / 2,
    }))

    const nodeMap = new Map(d3Nodes.map((n) => [n.id, n]))

    const d3Links: D3Link[] = edges
      .filter((e) => nodeMap.has(e.source_node_id) && nodeMap.has(e.target_node_id))
      .map((e) => ({
        id: e.id,
        source: nodeMap.get(e.source_node_id)!,
        target: nodeMap.get(e.target_node_id)!,
        relationship: e.relationship,
      }))

    // Create force simulation
    const simulation = d3
      .forceSimulation(d3Nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(d3Links)
          .id((d) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60))

    // Draw edges with arrows
    const defs = svg.append("defs")

    // Create arrow markers for each relationship type
    Object.entries(edgeColors).forEach(([rel, color]) => {
      defs
        .append("marker")
        .attr("id", `arrow-${rel}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", color)
        .attr("d", "M0,-5L10,0L0,5")
    })

    const link = g
      .append("g")
      .selectAll("line")
      .data(d3Links)
      .join("line")
      .attr("stroke", (d) => edgeColors[d.relationship])
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", (d) => `url(#arrow-${d.relationship})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation()
        const edge = edges.find((e) => e.id === d.id)
        setSelectedEdge(edge || null)
        setSelectedNode(null)
      })

    // Draw edge labels
    const linkLabels = g
      .append("g")
      .selectAll("text")
      .data(d3Links)
      .join("text")
      .attr("font-size", 10)
      .attr("fill", "#9ca3af")
      .attr("text-anchor", "middle")
      .text((d) => d.relationship)

    // Draw nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(d3Nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            // Save position to server
            fetch("/api/graph/nodes", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: d.id,
                position: { x: d.x, y: d.y },
              }),
            })
            d.fx = null
            d.fy = null
          }),
      )
      .on("click", (event, d) => {
        event.stopPropagation()
        const originalNode = nodes.find((n) => n.id === d.id)
        setSelectedNode(originalNode || null)
        setSelectedEdge(null)
      })

    // Node circles
    node
      .append("circle")
      .attr("r", 24)
      .attr("fill", (d) => nodeColors[d.node_type])
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)

    // Node labels
    node
      .append("text")
      .attr("dy", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .attr("font-size", 11)
      .attr("font-weight", 500)
      .text((d) => (d.label.length > 20 ? d.label.substring(0, 18) + "..." : d.label))

    // Node type icons (first letter)
    node
      .append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .text((d) => d.node_type.charAt(0).toUpperCase())

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as D3Node).x!)
        .attr("y1", (d) => (d.source as D3Node).y!)
        .attr("x2", (d) => (d.target as D3Node).x!)
        .attr("y2", (d) => (d.target as D3Node).y!)

      linkLabels
        .attr("x", (d) => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr("y", (d) => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2)

      node.attr("transform", (d) => `translate(${d.x},${d.y})`)
    })

    // Click on background to deselect
    svg.on("click", () => {
      setSelectedNode(null)
      setSelectedEdge(null)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, edges])

  const handleAddNode = async () => {
    if (!policyPackId || !newNodeData.label) return
    setIsAddingNode(true)

    try {
      await fetch("/api/graph/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_pack_id: policyPackId,
          ...newNodeData,
          properties: {},
        }),
      })
      mutate(`/api/graph?policyPackId=${policyPackId}`)
      setNewNodeData({ label: "", node_type: "condition", source_text: "" })
    } catch (err) {
      console.error("Failed to add node:", err)
    } finally {
      setIsAddingNode(false)
    }
  }

  const handleAddEdge = async () => {
    if (!policyPackId || !newEdgeData.source_node_id || !newEdgeData.target_node_id) return
    setIsAddingEdge(true)

    try {
      await fetch("/api/graph/edges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_pack_id: policyPackId,
          ...newEdgeData,
        }),
      })
      mutate(`/api/graph?policyPackId=${policyPackId}`)
      setNewEdgeData({ source_node_id: "", target_node_id: "", relationship: "TRIGGERS" })
    } catch (err) {
      console.error("Failed to add edge:", err)
    } finally {
      setIsAddingEdge(false)
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await fetch("/api/graph/nodes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nodeId }),
      })
      mutate(`/api/graph?policyPackId=${policyPackId}`)
      setSelectedNode(null)
    } catch (err) {
      console.error("Failed to delete node:", err)
    }
  }

  const handleDeleteEdge = async (edgeId: string) => {
    try {
      await fetch("/api/graph/edges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: edgeId }),
      })
      mutate(`/api/graph?policyPackId=${policyPackId}`)
      setSelectedEdge(null)
    } catch (err) {
      console.error("Failed to delete edge:", err)
    }
  }

  if (!policyPackId) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Select a policy pack to view its knowledge graph</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="bg-card">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Add Node Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Graph Node</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={newNodeData.label}
                        onChange={(e) => setNewNodeData((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., Risk Score > 50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Node Type</Label>
                      <Select
                        value={newNodeData.node_type}
                        onValueChange={(v) => setNewNodeData((prev) => ({ ...prev, node_type: v as NodeType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="threshold">Threshold</SelectItem>
                          <SelectItem value="entity_type">Entity Type</SelectItem>
                          <SelectItem value="action">Action</SelectItem>
                          <SelectItem value="condition">Condition</SelectItem>
                          <SelectItem value="risk_factor">Risk Factor</SelectItem>
                          <SelectItem value="document_type">Document Type</SelectItem>
                          <SelectItem value="jurisdiction">Jurisdiction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Source Text (optional)</Label>
                      <Input
                        value={newNodeData.source_text}
                        onChange={(e) => setNewNodeData((prev) => ({ ...prev, source_text: e.target.value }))}
                        placeholder="Original policy text"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddNode} disabled={isAddingNode || !newNodeData.label}>
                      {isAddingNode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Node
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add Edge Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <GitBranch className="h-4 w-4" />
                    Add Edge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Relationship</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Source Node</Label>
                      <Select
                        value={newEdgeData.source_node_id}
                        onValueChange={(v) => setNewEdgeData((prev) => ({ ...prev, source_node_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {nodes.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Select
                        value={newEdgeData.relationship}
                        onValueChange={(v) =>
                          setNewEdgeData((prev) => ({ ...prev, relationship: v as RelationshipType }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRIGGERS">TRIGGERS</SelectItem>
                          <SelectItem value="CASCADES_TO">CASCADES_TO</SelectItem>
                          <SelectItem value="REQUIRES">REQUIRES</SelectItem>
                          <SelectItem value="OVERRIDES">OVERRIDES</SelectItem>
                          <SelectItem value="APPLIES_TO">APPLIES_TO</SelectItem>
                          <SelectItem value="EXEMPTS">EXEMPTS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Node</Label>
                      <Select
                        value={newEdgeData.target_node_id}
                        onValueChange={(v) => setNewEdgeData((prev) => ({ ...prev, target_node_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent>
                          {nodes.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleAddEdge}
                      disabled={isAddingEdge || !newEdgeData.source_node_id || !newEdgeData.target_node_id}
                    >
                      {isAddingEdge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Edge
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              {Object.entries(nodeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-muted-foreground capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Canvas */}
      <Card className="bg-card">
        <CardContent className="p-0">
          <div ref={containerRef} className="relative h-[500px] w-full overflow-hidden rounded-lg bg-background/50">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <GitBranch className="h-12 w-12 mb-4" />
                <p>No graph data yet</p>
                <p className="text-xs mt-1">Ingest a policy to extract knowledge graph entities</p>
              </div>
            ) : (
              <svg ref={svgRef} className="h-full w-full" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: nodeColors[selectedNode.node_type] }} />
                {selectedNode.label}
              </CardTitle>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteNode(selectedNode.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {selectedNode.node_type.replace("_", " ")}
              </Badge>
            </div>
            {selectedNode.source_text && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Source Text:</p>
                <p className="text-foreground">{selectedNode.source_text}</p>
              </div>
            )}
            {Object.keys(selectedNode.properties).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Properties:</p>
                <pre className="bg-secondary/30 rounded p-2 text-xs overflow-x-auto">
                  {JSON.stringify(selectedNode.properties, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Edge Details */}
      {selectedEdge && (
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Relationship</CardTitle>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteEdge(selectedEdge.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${edgeColors[selectedEdge.relationship]}20`,
                  color: edgeColors[selectedEdge.relationship],
                }}
              >
                {selectedEdge.relationship}
              </Badge>
              <span className="text-muted-foreground">
                {nodes.find((n) => n.id === selectedEdge.source_node_id)?.label} →{" "}
                {nodes.find((n) => n.id === selectedEdge.target_node_id)?.label}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
