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
  model = "gpt-4o",
  schema,
  prompt,
  maxTokens = 4000,
}: {
  model?: string
  schema: T
  prompt: string
  maxTokens?: number
}): Promise<z.infer<T>> {
  // Convert Zod schema to JSON Schema
  let jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as any

  // Make schema strict for OpenAI
  jsonSchema = makeSchemaStrict(jsonSchema)

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that returns valid JSON matching the provided schema.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "response",
        description: "Structured response matching the schema",
        schema: jsonSchema,
        strict: true,
      },
    },
    max_tokens: maxTokens,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No content in OpenAI response")
  }

  // Parse and validate the response
  const parsed = JSON.parse(content)
  return schema.parse(parsed)
}

/**
 * Generate text from OpenAI
 */
export async function generateText({
  model = "gpt-4o",
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
    max_tokens: maxTokens,
    temperature,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error("No content in OpenAI response")
  }

  return content
}

