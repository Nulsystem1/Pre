"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, ArrowUpDown } from "lucide-react"

const events = [
  {
    id: "EVT-9001",
    time: "10:32:45",
    type: "Customer",
    entity: "James Morrison",
    entityId: "CUS-48291",
    risk: "Medium",
    decision: "Approved",
    control: null,
  },
  {
    id: "EVT-9000",
    time: "10:32:21",
    type: "Transaction",
    entity: "TXN-892741",
    entityId: "$45,200.00",
    risk: "High",
    decision: "Review",
    control: "TXN-Velocity-003",
  },
  {
    id: "EVT-8999",
    time: "10:31:58",
    type: "Customer",
    entity: "Sarah Williams",
    entityId: "CUS-48290",
    risk: "Low",
    decision: "Approved",
    control: null,
  },
  {
    id: "EVT-8998",
    time: "10:31:42",
    type: "Transaction",
    entity: "TXN-892740",
    entityId: "$1,250.00",
    risk: "Low",
    decision: "Approved",
    control: null,
  },
  {
    id: "EVT-8997",
    time: "10:31:15",
    type: "Transaction",
    entity: "TXN-892739",
    entityId: "$89,500.00",
    risk: "High",
    decision: "Blocked",
    control: "SANCT-Screen-001",
  },
  {
    id: "EVT-8996",
    time: "10:30:52",
    type: "Customer",
    entity: "Marcus Thompson",
    entityId: "CUS-48289",
    risk: "High",
    decision: "Review",
    control: "PEP-Screen-001",
  },
  {
    id: "EVT-8995",
    time: "10:30:28",
    type: "Transaction",
    entity: "TXN-892738",
    entityId: "$3,400.00",
    risk: "Low",
    decision: "Approved",
    control: null,
  },
  {
    id: "EVT-8994",
    time: "10:30:05",
    type: "Customer",
    entity: "Elena Rodriguez",
    entityId: "CUS-48288",
    risk: "Medium",
    decision: "Approved",
    control: null,
  },
]

const decisionStyles = {
  Approved: "bg-primary/20 text-primary",
  Review: "bg-warning/20 text-warning",
  Blocked: "bg-destructive/20 text-destructive",
}

const riskStyles = {
  Low: "text-primary",
  Medium: "text-warning",
  High: "text-destructive",
}

export function IncomingEvents() {
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  const [decisionFilter, setDecisionFilter] = useState("all")

  const filteredEvents = events.filter((event) => {
    if (eventTypeFilter !== "all" && event.type !== eventTypeFilter) return false
    if (decisionFilter !== "all" && event.decision !== decisionFilter) return false
    return true
  })

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Incoming Events</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-32 bg-transparent">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Customer">Customer</SelectItem>
              <SelectItem value="Transaction">Transaction</SelectItem>
            </SelectContent>
          </Select>
          <Select value={decisionFilter} onValueChange={setDecisionFilter}>
            <SelectTrigger className="w-32 bg-transparent">
              <SelectValue placeholder="Decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">Time</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead>Name / ID</TableHead>
                <TableHead className="w-20 text-center">Risk</TableHead>
                <TableHead className="w-28">Decision</TableHead>
                <TableHead>Control Fired</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-mono text-xs text-muted-foreground">{event.time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {event.type === "Customer" ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{event.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{event.entity}</p>
                      <p className="text-xs text-muted-foreground">{event.entityId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${riskStyles[event.risk as keyof typeof riskStyles]}`}>
                      {event.risk}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={decisionStyles[event.decision as keyof typeof decisionStyles]}
                    >
                      {event.decision}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.control ? (
                      <span className="rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground">
                        {event.control}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
