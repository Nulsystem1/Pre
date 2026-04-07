// OpenAI embeddings for Linear RAG vector search
import OpenAI from "openai"

let embeddingsClient: OpenAI | null = null

function getEmbeddingsClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for embeddings. Set it at runtime or omit embedding-dependent features.")
  }
  if (!embeddingsClient) {
    embeddingsClient = new OpenAI({ apiKey })
  }
  return embeddingsClient
}

// Generate embedding for a single text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getEmbeddingsClient().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    })

    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw new Error("Failed to generate embedding")
  }
}

// Generate embeddings for multiple texts in a batch
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await getEmbeddingsClient().embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    })

    return response.data.map((item) => item.embedding)
  } catch (error) {
    console.error("Error generating embeddings:", error)
    throw new Error("Failed to generate embeddings")
  }
}

// Generate embeddings for policy chunks
export async function generateChunkEmbeddings(
  chunks: Array<{ content: string }>
): Promise<Array<{ content: string; embedding: number[] }>> {
  const texts = chunks.map((chunk) => chunk.content)
  const embeddings = await generateEmbeddings(texts)

  return chunks.map((chunk, index) => ({
    content: chunk.content,
    embedding: embeddings[index],
  }))
}

// Calculate cosine similarity between two embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Search chunks by semantic similarity
export async function searchChunks(
  query: string,
  chunks: Array<{ content: string; embedding: number[] | null }>,
  limit = 10
): Promise<Array<{ content: string; similarity: number }>> {
  const queryEmbedding = await generateEmbedding(query)

  const results = chunks
    .filter((chunk) => chunk.embedding !== null)
    .map((chunk) => ({
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return results
}

