import OpenAI from "openai"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable")
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Recursively add additionalProperties: false and required fields to all objects in JSON Schema
 * This is required by OpenAI's strict schema mode
 */
function makeSchemaStrict(schema: any): any {
  if (typeof schema !== "object" || schema === null) {
    return schema
  }

  const result = { ...schema }

  // Add additionalProperties: false to all object types
  if (result.type === "object" && result.properties) {
    result.additionalProperties = false
    
    // Add all properties to required array (strict mode requires this)
    result.required = Object.keys(result.properties)
    
    // Recursively process nested properties
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [key, makeSchemaStrict(value)])
    )
  }

  // Process array items
  if (result.type === "array" && result.items) {
    result.items = makeSchemaStrict(result.items)
  }

  // Process anyOf, oneOf, allOf
  for (const key of ["anyOf", "oneOf", "allOf"]) {
    if (Array.isArray(result[key])) {
      result[key] = result[key].map(makeSchemaStrict)
    }
  }

  return result
}

/**
 * Generate structured output from OpenAI using JSON Schema
 */
export async function generateStructuredOutput<T extends z.ZodTypeAny>({
  model = "gpt-5.1-2025-11-13",
  schema,
  prompt,
  maxTokens = 4000,
}: {
  model?: string
  schema: T
  prompt: string
  maxTokens?: number
}): Promise<z.infer<T>> {
  // Convert Zod schema to JSON Schema for reference in prompt
  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as any

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that returns valid JSON matching the provided schema. 
        
Schema:
${JSON.stringify(jsonSchema, null, 2)}

Return ONLY valid JSON that conforms to this schema. Do not include any markdown formatting or additional text.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    max_completion_tokens: maxTokens,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    console.error("No content in response!")
    console.error("Finish reason:", response.choices[0]?.finish_reason)
    console.error("Refusal:", response.choices[0]?.message?.refusal)
    console.error("Usage:", response.usage)
    throw new Error(`No content in OpenAI response. Finish reason: ${response.choices[0]?.finish_reason}`)
  }

  // Parse and validate the response
  try {
    const parsed = JSON.parse(content)
    return schema.parse(parsed)
  } catch (error) {
    console.error("Failed to parse/validate OpenAI response:")
    console.error("Content preview:", content.substring(0, 1000))
    if (error instanceof Error) {
      console.error("Error:", error.message)
    }
    console.error("Full error:", error)
    throw new Error(`OpenAI response validation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate text from OpenAI
 */
export async function generateText({
  model = "gpt-5.1-2025-11-13",
  prompt,
  maxTokens = 1000,
  temperature = 0.7,
}: {
  model?: string
  prompt: string
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_completion_tokens: maxTokens,
    temperature,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No content in OpenAI response")
  }

  return content
}

