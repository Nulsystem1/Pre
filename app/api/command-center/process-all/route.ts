import { query } from "@/lib/supabase"

// POST - Process all pending decisions
export async function POST(req: Request) {
  try {
    const { max_concurrent = 3, confidence_threshold = 0.7 } = await req.json()

    // Get all pending decisions
    const { data: pending } = await query(
      "SELECT id FROM pending_decisions WHERE status = 'pending' ORDER BY priority DESC, created_at ASC",
      []
    )

    if (!pending || pending.length === 0) {
      return Response.json({
        success: true,
        data: {
          total: 0,
          processed: 0,
          approved: 0,
          blocked: 0,
          sent_to_review: 0,
          failed: 0,
        },
      })
    }

    const results = {
      total: pending.length,
      processed: 0,
      approved: 0,
      blocked: 0,
      sent_to_review: 0,
      failed: 0,
    }

    // Process in batches
    for (let i = 0; i < pending.length; i += max_concurrent) {
      const batch = pending.slice(i, i + max_concurrent)

      const promises = batch.map(async (item: any) => {
        try {
          // Call the process function directly instead of HTTP to avoid fetch issues
          const processResponse = await import("../process/[id]/route")
          const result = await processResponse.POST(
            new Request("http://localhost/api/command-center/process/" + item.id, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ confidenceThreshold: confidence_threshold }),
            }),
            { params: Promise.resolve({ id: item.id }) }
          )

          const jsonResult = await result.json()

          if (jsonResult.success) {
            results.processed++
            const decision = jsonResult.data.decision

            if (decision.requires_human_review) {
              results.sent_to_review++
            } else if (decision.outcome === "APPROVED") {
              results.approved++
            } else if (decision.outcome === "BLOCKED") {
              results.blocked++
            }
          } else {
            results.failed++
          }
        } catch (err) {
          console.error(`Failed to process ${item.id}:`, err)
          results.failed++
        }
      })

      await Promise.all(promises)
    }

    return Response.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error("Process all error:", error)
    return Response.json({ success: false, error: "Failed to process all decisions" }, { status: 500 })
  }
}

