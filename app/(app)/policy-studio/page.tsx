"use client"

import { useState } from "react"
import { PolicyPacksList } from "@/components/policy-studio/policy-packs-list"
import { PolicyEditor } from "@/components/policy-studio/policy-editor"
import { GraphVisualizer } from "@/components/policy-studio/graph-visualizer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCode2, GitBranch } from "lucide-react"

export default function PolicyStudioPage() {
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("editor")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Policy Studio</h1>
        <p className="text-muted-foreground">
          Create and manage compliance policy packs, extract knowledge graphs, and generate executable controls
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PolicyPacksList selectedPackId={selectedPackId} onSelectPack={setSelectedPackId} />
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="editor" className="gap-2">
                <FileCode2 className="h-4 w-4" />
                Policy Editor
              </TabsTrigger>
              <TabsTrigger value="graph" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Knowledge Graph
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor">
              <PolicyEditor selectedPackId={selectedPackId} />
            </TabsContent>
            <TabsContent value="graph">
              <GraphVisualizer policyPackId={selectedPackId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
