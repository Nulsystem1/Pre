"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, RefreshCw, Settings, CheckCircle, AlertTriangle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface IntegrationCardProps {
  integration: {
    id: string
    name: string
    description: string
    icon: LucideIcon
    status: "connected" | "disconnected" | "error"
    lastSync: string
    syncStatus: "healthy" | "warning" | "error"
  }
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const Icon = integration.icon

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">{integration.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  integration.status === "connected"
                    ? "bg-primary/20 text-primary"
                    : "bg-destructive/20 text-destructive"
                }
              >
                {integration.status === "connected" ? "Connected" : "Disconnected"}
              </Badge>
              {integration.syncStatus === "healthy" ? (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle className="h-3 w-3" />
                  Healthy
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Degraded
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{integration.description}</p>

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last sync: {integration.lastSync}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            Sync now
          </Button>
        </div>

        <Button variant="outline" className="w-full gap-2 bg-transparent">
          <ExternalLink className="h-4 w-4" />
          View API docs
        </Button>
      </CardContent>
    </Card>
  )
}
