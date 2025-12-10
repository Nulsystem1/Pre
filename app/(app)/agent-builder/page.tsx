"use client"

import { useCallback, useState } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Handle,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Save, 
  Zap, 
  Mail, 
  Webhook as WebhookIcon, 
  Database, 
  GitBranch, 
  Send,
  CheckCircle2,
  Plus,
  Clock,
  MessageSquare,
  FileText,
  X,
  Settings,
} from "lucide-react"

// Custom node types with dark theme styling and handles
const TriggerNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-indigo-500 bg-indigo-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <Zap className="h-4 w-4 text-indigo-400" />
      <div className="font-semibold text-sm text-indigo-100">Trigger</div>
    </div>
    <div className="text-xs text-indigo-300">{data.label}</div>
    {data.description && (
      <div className="text-xs text-muted-foreground mt-1">{data.description}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const DecisionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-purple-500 bg-purple-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <GitBranch className="h-4 w-4 text-purple-400" />
      <div className="font-semibold text-sm text-purple-100">Decision</div>
    </div>
    <div className="text-xs text-purple-300">{data.label}</div>
    {data.description && (
      <div className="text-xs text-muted-foreground mt-1">{data.description}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const ConditionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-yellow-500 bg-yellow-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <GitBranch className="h-4 w-4 text-yellow-400" />
      <div className="font-semibold text-sm text-yellow-100">Condition</div>
    </div>
    <div className="text-xs text-yellow-300">{data.label}</div>
    {data.condition && (
      <div className="text-xs text-muted-foreground mt-1">{data.condition}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const WebhookNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-blue-500 bg-blue-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <WebhookIcon className="h-4 w-4 text-blue-400" />
      <div className="font-semibold text-sm text-blue-100">Webhook</div>
    </div>
    <div className="text-xs text-blue-300">{data.label}</div>
    {data.url && (
      <div className="text-xs text-muted-foreground mt-1 font-mono">{data.url}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const EmailNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-green-500 bg-green-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <Mail className="h-4 w-4 text-green-400" />
      <div className="font-semibold text-sm text-green-100">Email</div>
    </div>
    <div className="text-xs text-green-300">{data.label}</div>
    {data.recipient && (
      <div className="text-xs text-muted-foreground mt-1">{data.recipient}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const SlackNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-pink-500 bg-pink-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <MessageSquare className="h-4 w-4 text-pink-400" />
      <div className="font-semibold text-sm text-pink-100">Slack</div>
    </div>
    <div className="text-xs text-pink-300">{data.label}</div>
    {data.channel && (
      <div className="text-xs text-muted-foreground mt-1">{data.channel}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const JiraNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-blue-600 bg-blue-600/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <FileText className="h-4 w-4 text-blue-500" />
      <div className="font-semibold text-sm text-blue-200">Jira</div>
    </div>
    <div className="text-xs text-blue-400">{data.label}</div>
    {data.project && (
      <div className="text-xs text-muted-foreground mt-1">Project: {data.project}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const DatabaseNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-orange-500 bg-orange-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <Database className="h-4 w-4 text-orange-400" />
      <div className="font-semibold text-sm text-orange-100">Database</div>
    </div>
    <div className="text-xs text-orange-300">{data.label}</div>
    {data.table && (
      <div className="text-xs text-muted-foreground mt-1">Table: {data.table}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const ApiNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-cyan-500 bg-cyan-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <Send className="h-4 w-4 text-cyan-400" />
      <div className="font-semibold text-sm text-cyan-100">API Call</div>
    </div>
    <div className="text-xs text-cyan-300">{data.label}</div>
    {data.endpoint && (
      <div className="text-xs text-muted-foreground mt-1 font-mono">{data.endpoint}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const DelayNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 rounded-lg border-2 border-gray-500 bg-gray-500/10 backdrop-blur min-w-[180px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    <div className="flex items-center gap-2 mb-1">
      <Clock className="h-4 w-4 text-gray-400" />
      <div className="font-semibold text-sm text-gray-100">Delay</div>
    </div>
    <div className="text-xs text-gray-300">{data.label}</div>
    {data.duration && (
      <div className="text-xs text-muted-foreground mt-1">{data.duration}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

const nodeTypes = {
  trigger: TriggerNode,
  decision: DecisionNode,
  condition: ConditionNode,
  webhook: WebhookNode,
  email: EmailNode,
  slack: SlackNode,
  jira: JiraNode,
  database: DatabaseNode,
  api: ApiNode,
  delay: DelayNode,
}

// Initial example workflow
const initialNodes: Node[] = [
  {
    id: "1",
    type: "trigger",
    position: { x: 250, y: 50 },
    data: { 
      label: "Vendor Application Received",
      description: "New vendor submits onboarding form"
    },
  },
  {
    id: "2",
    type: "decision",
    position: { x: 250, y: 180 },
    data: { 
      label: "AI Agent Evaluation",
      description: "Agent analyzes risk & compliance"
    },
  },
  {
    id: "3",
    type: "condition",
    position: { x: 100, y: 320 },
    data: { 
      label: "If APPROVED",
      condition: "outcome === 'APPROVED'"
    },
  },
  {
    id: "4",
    type: "condition",
    position: { x: 400, y: 320 },
    data: { 
      label: "If BLOCKED",
      condition: "outcome === 'BLOCKED'"
    },
  },
  {
    id: "5",
    type: "webhook",
    position: { x: 30, y: 470 },
    data: { 
      label: "Send to ERP",
      url: "POST /api/erp/onboard"
    },
  },
  {
    id: "6",
    type: "email",
    position: { x: 200, y: 470 },
    data: { 
      label: "Notify Procurement",
      recipient: "procurement@example.com"
    },
  },
  {
    id: "7",
    type: "slack",
    position: { x: 350, y: 470 },
    data: { 
      label: "Alert Compliance Team",
      channel: "#compliance-alerts"
    },
  },
  {
    id: "8",
    type: "database",
    position: { x: 520, y: 470 },
    data: { 
      label: "Add to Blocklist",
      table: "blocked_vendors"
    },
  },
  {
    id: "9",
    type: "jira",
    position: { x: 200, y: 620 },
    data: { 
      label: "Create Tracking Ticket",
      project: "COMPLIANCE"
    },
  },
  {
    id: "10",
    type: "delay",
    position: { x: 670, y: 50 },
    data: { 
      label: "Wait for Review",
      duration: "24 hours"
    },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#a78bfa", strokeWidth: 2 } },
  { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#10b981", strokeWidth: 2 } },
  { id: "e2-4", source: "2", target: "4", animated: true, style: { stroke: "#ef4444", strokeWidth: 2 } },
  { id: "e3-5", source: "3", target: "5", animated: true, style: { stroke: "#3b82f6", strokeWidth: 2 } },
  { id: "e3-6", source: "3", target: "6", animated: true, style: { stroke: "#10b981", strokeWidth: 2 } },
  { id: "e4-7", source: "4", target: "7", animated: true, style: { stroke: "#ec4899", strokeWidth: 2 } },
  { id: "e4-8", source: "4", target: "8", animated: true, style: { stroke: "#f97316", strokeWidth: 2 } },
  { id: "e5-9", source: "5", target: "9", animated: false, style: { stroke: "#a78bfa", strokeWidth: 2 } },
  { id: "e6-9", source: "6", target: "9", animated: false, style: { stroke: "#a78bfa", strokeWidth: 2 } },
]

export default function AgentBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [saved, setSaved] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#a78bfa", strokeWidth: 2 } }, eds)),
    [setEdges]
  )

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.setData("application/reactflow-label", label)
    event.dataTransfer.effectAllowed = "move"
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()

    const type = event.dataTransfer.getData("application/reactflow")
    const label = event.dataTransfer.getData("application/reactflow-label")

    if (typeof type === "undefined" || !type) {
      return
    }

    const reactFlowBounds = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - reactFlowBounds.left - 100,
      y: event.clientY - reactFlowBounds.top - 50,
    }

    const newNode = {
      id: `${Date.now()}`,
      type,
      position,
      data: { label: `New ${label}` },
    }

    setNodes((nds) => nds.concat(newNode))
  }

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }

  const updateNodeData = (field: string, value: string) => {
    if (!selectedNode) return
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [field]: value } }
          : node
      )
    )
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, [field]: value } })
  }

  const nodeCategories = {
    triggers: [
      { type: "trigger", icon: Zap, label: "Event Trigger", colorClass: "border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20", iconColor: "text-indigo-400" },
    ],
    logic: [
      { type: "decision", icon: GitBranch, label: "Decision", colorClass: "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20", iconColor: "text-purple-400" },
      { type: "condition", icon: GitBranch, label: "Condition", colorClass: "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20", iconColor: "text-yellow-400" },
      { type: "delay", icon: Clock, label: "Delay", colorClass: "border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/20", iconColor: "text-gray-400" },
    ],
    actions: [
      { type: "email", icon: Mail, label: "Email", colorClass: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20", iconColor: "text-green-400" },
      { type: "slack", icon: MessageSquare, label: "Slack", colorClass: "border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20", iconColor: "text-pink-400" },
      { type: "webhook", icon: WebhookIcon, label: "Webhook", colorClass: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20", iconColor: "text-blue-400" },
      { type: "jira", icon: FileText, label: "Jira", colorClass: "border-blue-600/50 bg-blue-600/10 hover:bg-blue-600/20", iconColor: "text-blue-500" },
      { type: "api", icon: Send, label: "API Call", colorClass: "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20", iconColor: "text-cyan-400" },
      { type: "database", icon: Database, label: "Database", colorClass: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20", iconColor: "text-orange-400" },
    ],
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Agent Action Builder</h1>
            <p className="text-muted-foreground">
              Visual workflow designer for autonomous agent actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2" variant={saved ? "default" : "default"}>
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Workflow
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Node Palette */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Node Library</span>
            <Badge variant="outline" className="text-xs">Drag to canvas</Badge>
          </div>
          
          <div className="space-y-4">
            {/* Triggers */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Triggers</h3>
              <div className="flex flex-wrap gap-2">
                {nodeCategories.triggers.map((template) => {
                  const Icon = template.icon
                  return (
                    <div
                      key={template.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, template.type, template.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 cursor-move transition-colors ${template.colorClass}`}
                    >
                      <Icon className={`h-4 w-4 ${template.iconColor}`} />
                      <span className="text-xs font-medium">{template.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Logic */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Logic & Flow</h3>
              <div className="flex flex-wrap gap-2">
                {nodeCategories.logic.map((template) => {
                  const Icon = template.icon
                  return (
                    <div
                      key={template.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, template.type, template.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 cursor-move transition-colors ${template.colorClass}`}
                    >
                      <Icon className={`h-4 w-4 ${template.iconColor}`} />
                      <span className="text-xs font-medium">{template.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions & Integrations */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Actions & Integrations</h3>
              <div className="flex flex-wrap gap-2">
                {nodeCategories.actions.map((template) => {
                  const Icon = template.icon
                  return (
                    <div
                      key={template.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, template.type, template.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 cursor-move transition-colors ${template.colorClass}`}
                    >
                      <Icon className={`h-4 w-4 ${template.iconColor}`} />
                      <span className="text-xs font-medium">{template.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Canvas */}
        <div 
          className="flex-1 border-2 border-border rounded-lg overflow-hidden"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#a78bfa", strokeWidth: 2 },
            }}
          >
            <Controls />
            <MiniMap 
              className="bg-muted"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'trigger': return '#6366f1'
                  case 'decision': return '#a855f7'
                  case 'webhook': return '#3b82f6'
                  case 'email': return '#10b981'
                  case 'slack': return '#ec4899'
                  case 'jira': return '#2563eb'
                  case 'database': return '#f97316'
                  case 'api': return '#06b6d4'
                  case 'condition': return '#eab308'
                  case 'delay': return '#6b7280'
                  default: return '#6b7280'
                }
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#444" />
          </ReactFlow>
        </div>

        {/* Footer Info */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {nodes.length} nodes
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {edges.length} connections
            </span>
          </div>
          <span className="italic">
            * Drag nodes from palette • Click to configure • Connect nodes by dragging between handles
          </span>
        </div>
      </div>

      {/* Configuration Panel */}
      {selectedNode && (
        <Card className="w-80 p-4">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure Node
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={selectedNode.data.label || ""}
                onChange={(e) => updateNodeData("label", e.target.value)}
                placeholder="Enter node label"
              />
            </div>

            {selectedNode.type === "email" && (
              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={selectedNode.data.recipient || ""}
                  onChange={(e) => updateNodeData("recipient", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            )}

            {selectedNode.type === "slack" && (
              <div>
                <Label htmlFor="channel">Channel</Label>
                <Input
                  id="channel"
                  value={selectedNode.data.channel || ""}
                  onChange={(e) => updateNodeData("channel", e.target.value)}
                  placeholder="#channel-name"
                />
              </div>
            )}

            {selectedNode.type === "webhook" && (
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={selectedNode.data.url || ""}
                  onChange={(e) => updateNodeData("url", e.target.value)}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
            )}

            {selectedNode.type === "jira" && (
              <div>
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={selectedNode.data.project || ""}
                  onChange={(e) => updateNodeData("project", e.target.value)}
                  placeholder="PROJECT-KEY"
                />
              </div>
            )}

            {selectedNode.type === "database" && (
              <div>
                <Label htmlFor="table">Table Name</Label>
                <Input
                  id="table"
                  value={selectedNode.data.table || ""}
                  onChange={(e) => updateNodeData("table", e.target.value)}
                  placeholder="table_name"
                />
              </div>
            )}

            {selectedNode.type === "api" && (
              <div>
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input
                  id="endpoint"
                  value={selectedNode.data.endpoint || ""}
                  onChange={(e) => updateNodeData("endpoint", e.target.value)}
                  placeholder="POST /api/endpoint"
                />
              </div>
            )}

            {selectedNode.type === "condition" && (
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  value={selectedNode.data.condition || ""}
                  onChange={(e) => updateNodeData("condition", e.target.value)}
                  placeholder="field === value"
                />
              </div>
            )}

            {selectedNode.type === "delay" && (
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={selectedNode.data.duration || ""}
                  onChange={(e) => updateNodeData("duration", e.target.value)}
                  placeholder="5 minutes"
                />
              </div>
            )}

            {(selectedNode.type === "trigger" || selectedNode.type === "decision") && (
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={selectedNode.data.description || ""}
                  onChange={(e) => updateNodeData("description", e.target.value)}
                  placeholder="Enter description"
                />
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Node ID:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{selectedNode.id}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

