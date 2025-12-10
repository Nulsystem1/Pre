"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Play, CheckCircle2, XCircle, AlertTriangle, Settings } from "lucide-react"
import type { AuditEvent } from "@/lib/types"

export function AuditTimeline() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    loadAuditEvents()
  }, [filter])

  const loadAuditEvents = async () => {
    setLoading(true)
    try {
      const url = filter === "all" 
        ? "/api/audit-events?limit=100"
        : `/api/audit-events?event_type=${filter}&limit=100`
      
      const res = await fetch(url)
      const { data } = await res.json()
      setAuditEvents(data || [])
    } catch (error) {
      console.error("Error loading audit events:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "DOCUMENT_INGESTED":
        return <FileText className="h-4 w-4" />
      case "EVENT_SIMULATED":
        return <Play className="h-4 w-4" />
      case "REVIEW_COMPLETED":
        return <CheckCircle2 className="h-4 w-4" />
      case "CONTROL_UPDATED":
        return <Settings className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "DOCUMENT_INGESTED":
        return "text-blue-600"
      case "EVENT_SIMULATED":
        return "text-purple-600"
      case "REVIEW_COMPLETED":
        return "text-green-600"
      case "CONTROL_UPDATED":
        return "text-orange-600"
      default:
        return "text-slate-600"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Complete timeline of system events</CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="DOCUMENT_INGESTED">Document Ingested</SelectItem>
              <SelectItem value="EVENT_SIMULATED">Event Simulated</SelectItem>
              <SelectItem value="REVIEW_COMPLETED">Review Completed</SelectItem>
              <SelectItem value="CONTROL_UPDATED">Control Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {auditEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No audit events found</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
            
            {/* Events */}
            <div className="space-y-4">
              {auditEvents.map((event) => (
                <div key={event.id} className="relative flex gap-4 pb-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 ${getEventColor(event.event_type)} border-current`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {event.event_type.replace(/_/g, " ")}
                          </Badge>
                          {event.actor && (
                            <span className="text-xs text-muted-foreground">
                              by {event.actor}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View details
                            </summary>
                            <pre className="text-xs bg-slate-50 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

