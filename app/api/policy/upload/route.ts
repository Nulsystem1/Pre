import { NextResponse } from "next/server"
import pdfParses from "pdf-parse"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * POST /api/policy/upload
 * Accepts multipart/form-data with a single file.
 * Returns extracted text for .txt and .pdf (uses pdf-parse for PDF).
 * Note: Buffer deprecation warnings may come from the pdf-parse dependency; we use Buffer.from() here.
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

    if (!name.endsWith(".txt") && !name.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only .txt and .pdf files are supported." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let text: string
      // Optional: install pdf-parse for PDF support: pnpm add pdf-parse

    if (name.endsWith(".txt")) {
      text = buffer.toString("utf-8")
    } else if (name.endsWith(".pdf")) {
      try {
        const pdfParse = (await pdfParses)
        const data = await pdfParse(buffer)
        text = data.text || ""
      } catch (e) {
        const message = e instanceof Error ? e.message : "PDF parsing failed"
        console.error("PDF extraction error:", message)
        return NextResponse.json(
          {
            success: false,
            error:
              "PDF text extraction failed. Try uploading a .txt file, or ensure pdf-parse is installed and the PDF is valid.",
          },
          { status: 503 }
        )
      }
    } else {
      text = ""
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, error: "No text could be extracted from the file." },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, text })
  } catch (error) {
    console.error("Policy upload error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process upload" },
      { status: 500 }
    )
  }
}
