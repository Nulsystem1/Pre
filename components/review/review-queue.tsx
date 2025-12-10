"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import type { ReviewItem } from "@/lib/types"

export function ReviewQueue() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null)
  const [reviewerNotes, setReviewerNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadReviewItems()
  }, [])

  const loadReviewItems = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/review-queue?status=pending")
      const { data } = await res.json()
      setReviewItems(data || [])
    } catch (error) {
      console.error("Error loading review items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: "approve" | "override" | "escalate") => {
    if (!selectedItem) return

    setProcessing(true)
    try {
      await fetch(`/api/review-queue/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_action: action,
          reviewer_notes: reviewerNotes,
          reviewed_by: "demo-user",
        }),
      })

      // Refresh list
      await loadReviewItems()
      
      // Close dialog
      setSelectedItem(null)
      setReviewerNotes("")
    } catch (error) {
      console.error("Error processing review:", error)
    } finally {
      setProcessing(false)
    }
  }

  const openReviewDialog = (item: ReviewItem) => {
    setSelectedItem(item)
    setReviewerNotes("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Queue ({reviewItems.length})</CardTitle>
          <CardDescription>
            Items requiring human review due to low confidence or policy requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p>No pending review items</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Recommended Action</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.entity_name || item.entity_id}</div>
                        <div className="text-xs text-muted-foreground">{item.entity_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.confidence_score >= 0.8
                                ? "bg-green-600"
                                : item.confidence_score >= 0.5
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${item.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">{(item.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.recommended_action === "BLOCK"
                            ? "destructive"
                            : item.recommended_action === "REVIEW"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {item.recommended_action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(item)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Item</DialogTitle>
            <DialogDescription>
              Review the event and take action
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Entity</Label>
                  <p className="font-medium">{selectedItem.entity_name || selectedItem.entity_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Confidence</Label>
                  <p className="font-medium">{(selectedItem.confidence_score * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Recommended Action</Label>
                  <Badge
                    variant={
                      selectedItem.recommended_action === "BLOCK"
                        ? "destructive"
                        : selectedItem.recommended_action === "REVIEW"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedItem.recommended_action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{new Date(selectedItem.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedItem.reasoning && (
                <div>
                  <Label className="text-muted-foreground">AI Reasoning</Label>
                  <p className="text-sm bg-slate-50 p-3 rounded-md mt-1">
                    {selectedItem.reasoning}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reviewerNotes">Reviewer Notes</Label>
                <Textarea
                  id="reviewerNotes"
                  placeholder="Add notes about your decision..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction("escalate")}
              disabled={processing}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Escalate
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction("override")}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Override (Block)
            </Button>
            <Button
              onClick={() => handleAction("approve")}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

