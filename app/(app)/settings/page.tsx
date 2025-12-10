"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, User, Bot } from "lucide-react"

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  
  // Profile Settings
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nul_profile")
      return stored ? JSON.parse(stored) : {
        name: "John Doe",
        email: "john.doe@company.com",
        role: "Compliance Officer",
        organization: "Acme Corp",
      }
    }
    return {
      name: "John Doe",
      email: "john.doe@company.com",
      role: "Compliance Officer",
      organization: "Acme Corp",
    }
  })

  // Agent Settings
  const [agentSettings, setAgentSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nul_agent_settings")
      return stored ? JSON.parse(stored) : {
        confidenceThreshold: 0.7,
        maxAttempts: 3,
        customInstructions: "Be thorough and conservative when assessing vendor risk. Prioritize regulatory compliance over speed.",
      }
    }
    return {
      confidenceThreshold: 0.7,
      maxAttempts: 3,
      customInstructions: "Be thorough and conservative when assessing vendor risk. Prioritize regulatory compliance over speed.",
    }
  })

  const handleSaveProfile = () => {
    localStorage.setItem("nul_profile", JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveAgent = () => {
    localStorage.setItem("nul_agent_settings", JSON.stringify(agentSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and agent configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="agent">
            <Bot className="h-4 w-4 mr-2" />
            Agent Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {saved ? "Saved!" : "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Settings */}
        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Decision Configuration</CardTitle>
              <CardDescription>
                Configure how the AI agent makes decisions and routes items to human review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Confidence Threshold */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confidence Threshold</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimum confidence required to auto-approve/block without human review
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{(agentSettings.confidenceThreshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Slider
                  value={[agentSettings.confidenceThreshold * 100]}
                  onValueChange={([value]) => setAgentSettings({ ...agentSettings, confidenceThreshold: value / 100 })}
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50% (Aggressive)</span>
                  <span>95% (Conservative)</span>
                </div>
              </div>

              {/* Max Attempts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maximum Agent Attempts</Label>
                    <p className="text-sm text-muted-foreground">
                      How many times should the agent refine its search before giving up
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{agentSettings.maxAttempts}</span>
                  </div>
                </div>
                <Slider
                  value={[agentSettings.maxAttempts]}
                  onValueChange={([value]) => setAgentSettings({ ...agentSettings, maxAttempts: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 (Fast)</span>
                  <span>5 (Thorough)</span>
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-2">
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <p className="text-sm text-muted-foreground">
                  Additional guidance for the AI agent when making decisions
                </p>
                <Textarea
                  id="customInstructions"
                  value={agentSettings.customInstructions}
                  onChange={(e) => setAgentSettings({ ...agentSettings, customInstructions: e.target.value })}
                  rows={6}
                  placeholder="E.g., Be conservative with vendor approvals, prioritize sanctions screening..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAgent}>
                  <Save className="h-4 w-4 mr-2" />
                  {saved ? "Saved!" : "Save Agent Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>💡 How it works:</strong> When the agent's confidence falls below the threshold,
                it will route the decision to human review. Lower thresholds mean more automation,
                higher thresholds mean more human oversight. The agent will attempt to refine its
                search up to the maximum attempts before routing to review.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
