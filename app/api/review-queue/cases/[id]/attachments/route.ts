import { query } from "@/lib/supabase"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_EXTRACTED_LENGTH = 200_000 // cap stored text

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return data.text || ""
  } catch {
    return ""
  }
}

/**
 * POST /api/review-queue/cases/[id]/attachments
 * Upload a file (PDF, TXT, or CSV) as a case attachment. Extracts text and stores with metadata.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get("file")
    const uploadedBy = (formData.get("uploaded_by") as string) || "sarah chen"

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: "Missing or invalid file. Send a file with key 'file'." },
        { status: 400 }
      )
    }

    const name = file.name.toLowerCase()
    if (!name.endsWith(".csv") && !name.endsWith(".txt") && !name.endsWith(".pdf")) {
      return Response.json(
        { success: false, error: "Only .pdf, .txt, and .csv are supported." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: "File too large. Max 5 MB." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = name.endsWith(".pdf") ? "pdf" : name.endsWith(".csv") ? "csv" : "txt"
    const extractedText =
      fileType === "pdf"
        ? await extractPdfText(buffer)
        : buffer.toString("utf-8")

    const text = (extractedText || "").trim()
    const storedText = text.length > MAX_EXTRACTED_LENGTH
      ? text.slice(0, MAX_EXTRACTED_LENGTH) + "\n\n[truncated]"
      : text

    const { data: rows, error: fetchError } = await query(
      "SELECT attachments FROM review_queue_cases WHERE id = $1",
      [id]
    )
    if (fetchError) throw fetchError
    const row = rows?.[0]
    if (!row) {
      return Response.json({ success: false, error: "Case not found" }, { status: 404 })
    }

    const attachments = Array.isArray(row.attachments) ? row.attachments : []
    const newAttachment = {
      file_name: file.name,
      file_type: fileType,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      extracted_text: storedText || undefined,
    }
    attachments.push(newAttachment)

    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await query(
      `UPDATE review_queue_cases SET attachments = $1, updated_at = $2 WHERE id = $3
       RETURNING id, case_id, status, assigned_to, validation_result, attachments, audit_log,
                 structured_edits, command_center_result_id, policy_pack_id, created_at, updated_at`,
      [JSON.stringify(attachments), now, id]
    )

    if (updateError) throw updateError
    const r = updated?.[0]
    if (!r) {
      return Response.json({ success: false, error: "Update failed" }, { status: 500 })
    }

    return Response.json({
      success: true,
      data: {
        id: r.id,
        case_id: r.case_id,
        status: r.status,
        assigned_to: r.assigned_to,
        validation_result: r.validation_result ?? {},
        attachments: r.attachments ?? [],
        audit_log: r.audit_log ?? [],
        structured_edits: r.structured_edits ?? {},
        policy_pack_id: r.policy_pack_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
    })
  } catch (e) {
    console.error("Upload case attachment error:", e)
    return Response.json(
      { success: false, error: "Failed to upload attachment" },
      { status: 500 }
    )
  }
}
