"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Download } from "lucide-react"

interface AuditFiltersProps {
  filters: {
    dateRange: string
    decision: string
    control: string
    customer: string
  }
  onFiltersChange: (filters: AuditFiltersProps["filters"]) => void
}

export function AuditFilters({ filters, onFiltersChange }: AuditFiltersProps) {
  return (
    <Card className="bg-card">
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <Select value={filters.dateRange} onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}>
          <SelectTrigger className="w-40 bg-transparent">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.decision} onValueChange={(value) => onFiltersChange({ ...filters, decision: value })}>
          <SelectTrigger className="w-36 bg-transparent">
            <SelectValue placeholder="Decision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decisions</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Review">Review</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.control} onValueChange={(value) => onFiltersChange({ ...filters, control: value })}>
          <SelectTrigger className="w-44 bg-transparent">
            <SelectValue placeholder="Control" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All controls</SelectItem>
            <SelectItem value="KYC-001">KYC-001</SelectItem>
            <SelectItem value="PEP-Screen-001">PEP-Screen-001</SelectItem>
            <SelectItem value="TXN-Velocity-003">TXN-Velocity-003</SelectItem>
            <SelectItem value="SANCT-Screen-001">SANCT-Screen-001</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer ID or name..."
            value={filters.customer}
            onChange={(e) => onFiltersChange({ ...filters, customer: e.target.value })}
            className="bg-transparent pl-9"
          />
        </div>

        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardContent>
    </Card>
  )
}
