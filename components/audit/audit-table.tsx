"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, ArrowUpDown } from "lucide-react"
import type { AuditRecord } from "@/app/(app)/audit-explorer/page"

const decisionStyles = {
  Approved: "bg-primary/20 text-primary",
  Review: "bg-warning/20 text-warning",
  Blocked: "bg-destructive/20 text-destructive",
}

interface AuditTableProps {
  records: AuditRecord[]
  onSelectRecord: (record: AuditRecord) => void
}

export function AuditTable({ records, onSelectRecord }: AuditTableProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Audit Records ({records.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-44">Time</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-28">Decision</TableHead>
                <TableHead className="hidden lg:table-cell">Control</TableHead>
                <TableHead className="hidden md:table-cell">Policy Version</TableHead>
                <TableHead className="w-32">Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="cursor-pointer hover:bg-secondary/50"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">{record.time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {record.entityType === "Customer" ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{record.entityName}</p>
                        <p className="text-xs text-muted-foreground">{record.entityId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={decisionStyles[record.decision]}>
                      {record.decision}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {record.control ? (
                      <span className="rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground">
                        {record.control}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {record.policyVersion}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{record.actor}</p>
                      {record.actorName && <p className="text-xs text-muted-foreground">{record.actorName}</p>}
                    </div>
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
