import { generateStructuredOutput } from "@/lib/openai-client"
import { z } from "zod"

const autofillSchema = z.object({
  vendor: z.object({
    name: z.string(),
    country: z.string(),
    annual_spend: z.number(),
    sanctions_check: z.enum(["CLEAR", "MATCH", "PENDING"]),
    business_type: z.string(),
    relationship_length_years: z.number(),
  }),
  suggested_priority: z.enum(["high", "medium", "low"]),
  reasoning: z.string(),
})

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { partial_input } = await req.json()

    const result = await generateStructuredOutput({
      model: "gpt-5.1-2025-11-13",
      schema: autofillSchema,
      maxTokens: 500,
      prompt: `You are helping fill out a vendor onboarding form. Generate realistic data based on partial input.

Partial Input: ${partial_input || "None"}

Generate complete, realistic vendor data. If user provided any info, use it. Otherwise, create realistic data for demo purposes.

Examples:
- High risk: sanctioned countries, high spend, MATCH on sanctions
- Medium risk: emerging markets, moderate spend
- Low risk: established democracies, low spend, CLEAR sanctions`,
    })

    return Response.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Autofill error:", error)
    return Response.json({ success: false, error: "Failed to autofill" }, { status: 500 })
  }
}

