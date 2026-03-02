import { NextResponse } from "next/server"
import { z } from "zod"
import { generateStructuredOutput } from "@/lib/openai-client"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_CSV_ROWS_FOR_AI = 100 // cap rows sent to AI for large CSVs

/**
 * POST /api/command-center/parse-data-file
 * Accepts CSV, PDF, or .txt as user data to validate.
 * Returns { events: [{ event_type, event_data, priority? }] }.
 * - CSV: parsed generically; AI infers event_type and event_data structure from the user's columns and data.
 * - PDF/txt: single event with document_text for the agent to interpret.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid file. Send a single file with key 'file'." },
        { status: 400 }
      )
    }

    const name = file.name.toLowerCase()
    if (!name.endsWith(".csv") && !name.endsWith(".txt") && !name.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only .csv, .txt, and .pdf are supported." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Max 5 MB." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = name.endsWith(".csv") || name.endsWith(".txt")
      ? buffer.toString("utf-8")
      : await extractPdfText(buffer)

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, error: "No text could be extracted from the file." },
        { status: 400 }
      )
    }

    let events: Array<{ event_type: string; event_data: Record<string, unknown>; priority?: string }>

    if (name.endsWith(".csv")) {
      events = await parseCsvWithAi(text)
    } else {
      events = [
        {
          event_type: "DOCUMENT_VALIDATION",
          event_data: { document_text: text.trim(), source: "upload", file_name: file.name },
          priority: "medium",
        },
      ]
    }

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows or content found." },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error("Parse data file error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to parse file" },
      { status: 500 }
    )
  }
}

const csvParseResultSchema = z.object({
  event_type: z.string().describe("Short event type inferred from the data, e.g. VENDOR_ONBOARDING, EMPLOYEE_DATA, PURCHASE_REQUEST"),
  events: z.array(
    z.object({
      event_data: z.record(z.unknown()).describe("Structured payload for this row; preserve the user's CSV column names as keys and use appropriate types (string, number, boolean) per value"),
      priority: z.enum(["low", "medium", "high"]).optional(),
    })
  ),
})

/**
 * Parse CSV into generic rows, then use AI to infer event_type and structure event_data from the user's columns.
 */
async function parseCsvWithAi(csv: string): Promise<Array<{ event_type: string; event_data: Record<string, unknown>; priority?: string }>> {
  const rows = parseCsvToRows(csv)
  if (rows.length === 0) return []

  const rowsForAi = rows.length > MAX_CSV_ROWS_FOR_AI ? rows.slice(0, MAX_CSV_ROWS_FOR_AI) : rows
  const sample = JSON.stringify(rowsForAi, null, 2)

  const result = await generateStructuredOutput({
    model: "gpt-5.1-2025-11-13",
    schema: csvParseResultSchema,
    maxTokens: 8000,
    prompt: `You are normalizing user CSV data for a compliance/validation engine. The user uploaded a CSV; below is the parsed structure (array of row objects, keys = column headers).

CSV rows (up to ${MAX_CSV_ROWS_FOR_AI} rows shown):
${sample}

Tasks:
1. Infer a single event_type string that describes this dataset (e.g. VENDOR_ONBOARDING, EMPLOYEE_DATA, PURCHASE_REQUEST, EXPENSE_REPORT). Use the column names and sample values to decide.
2. For each row, output an event_data object. Preserve the user's structure: use their column names as keys. Convert numeric-looking strings to numbers and boolean-like values to booleans where appropriate. Do not rename columns to a fixed schema; keep the user's own structure so the validation engine can evaluate against any schema.
3. Optionally set priority (low/medium/high) per row if the data suggests it.

Return one event_type for the whole file and an events array with one object per row, each with event_data (and optional priority).`,
  })

  const events = result.events.map((e) => ({
    event_type: result.event_type,
    event_data: e.event_data as Record<string, unknown>,
    priority: e.priority ?? "medium",
  }))

  if (rows.length > MAX_CSV_ROWS_FOR_AI) {
    const rest = rows.slice(MAX_CSV_ROWS_FOR_AI)
    for (const row of rest) {
      events.push({
        event_type: result.event_type,
        event_data: row as Record<string, unknown>,
        priority: "medium",
      })
    }
  }

  return events
}

function parseCsvToRows(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows: Record<string, unknown>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, unknown> = {}
    header.forEach((h, j) => {
      const raw = values[j] ?? ""
      row[h] = coerceValue(raw)
    })
    rows.push(row)
  }

  return rows
}

function coerceValue(raw: string): string | number | boolean {
  const t = raw.trim()
  if (t === "" || t === "null") return t || ""
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === "true"
  return t
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if ((c === "," && !inQuotes) || c === "\n") {
      result.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return data.text || ""
  } catch {
    return ""
  }
}
