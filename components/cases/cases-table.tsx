"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Case } from "@/app/(app)/cases/page"

const statusStyles = {
  Open: "bg-primary/20 text-primary",
  "Under Review": "bg-warning/20 text-warning",
  "Pending Info": "bg-chart-2/20 text-chart-2",
  Closed: "bg-muted text-muted-foreground",
}

function getRiskColor(score: number) {
  if (score >= 80) return "text-destructive"
  if (score >= 60) return "text-warning"
  return "text-primary"
}

interface CasesTableProps {
  cases: Case[]
  onSelectCase: (c: Case) => void
}

export function CasesTable({ cases, onSelectCase }: CasesTableProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Open Cases ({cases.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28">Case ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Primary Reason</TableHead>
                <TableHead className="w-24 text-center">Risk Score</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-28 text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id} onClick={() => onSelectCase(c)} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-primary">{c.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{c.customer}</p>
                      <p className="text-xs text-muted-foreground">{c.customerId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {c.primaryReason}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getRiskColor(c.riskScore)}`}>{c.riskScore}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusStyles[c.status]}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{c.lastUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
