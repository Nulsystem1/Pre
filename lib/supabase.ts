// Direct Postgres connection for local development
// Bypasses PostgREST to avoid JWT issues
import { Pool } from "pg"
import type { Database } from "./database.types"

// Lazy pool so Next.js build can run without POSTGRES_URL (e.g. Docker build on Fly.io)
let pool: Pool | null = null
function getPool(): Pool {
  if (!pool) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("Missing POSTGRES_URL environment variable")
    }
    pool = new Pool({ connectionString: process.env.POSTGRES_URL })
  }
  return pool
}


// For direct Postgres connection
export const getPostgresUrl = () => process.env.POSTGRES_URL!

// Helper to execute direct SQL queries
export async function query(sql: string, params: unknown[] = []) {
  try {
    const result = await getPool().query(sql, params)
    return { data: result.rows, error: null, count: result.rows.length }
  } catch (error) {
    return { data: null, error, count: 0 }
  }
}

// Create a Supabase-like client wrapper for compatibility
const createSupabaseLikeClient = () => {
  return {
    from: (table: string) => ({
      select: (columns: string = "*", options?: { count?: "exact"; head?: boolean }) => {
        let sql = `SELECT ${columns} FROM ${table}`
        const params: unknown[] = []
        let paramIndex = 1

        const builder = {
          eq: (column: string, value: unknown) => {
            sql += ` WHERE ${column} = $${paramIndex}`
            params.push(value)
            paramIndex++
            return builder
          },
          order: (column: string, options?: { ascending?: boolean }) => {
            const order = options?.ascending === false ? "DESC" : "ASC"
            sql += ` ORDER BY ${column} ${order}`
            return builder
          },
          limit: (count: number) => {
            sql += ` LIMIT ${count}`
            return builder
          },
          single: async () => {
            sql += " LIMIT 1"
            const result = await query(sql, params)
            if (result.error) throw result.error
            return { data: result.data?.[0] || null, error: null }
          },
          async then(resolve: (value: any) => any) {
            if (options?.head && options?.count === "exact") {
              const countSql = sql.replace(/^SELECT \* FROM/i, "SELECT COUNT(*)::int AS count FROM")
              const result = await query(countSql, params)
              if (result.error) {
                resolve({ count: 0, error: result.error })
              } else {
                const count = result.data?.[0]?.count ?? 0
                resolve({ count: Number(count), error: null })
              }
            } else if (options?.head) {
              resolve({ count: 0, error: null })
            } else {
              const result = await query(sql, params)
              if (result.error) {
                resolve({ data: null, error: result.error, count: 0 })
              } else {
                resolve({ data: result.data || [], error: null, count: result.count })
              }
            }
          },
        }
        return builder
      },
      insert: (data: Record<string, unknown> | Array<Record<string, unknown>>) => ({
        select: (columns: string = "*") => ({
          single: async () => {
            const records = Array.isArray(data) ? data : [data]
            if (records.length === 0) {
              return { data: null, error: null }
            }
            const keys = Object.keys(records[0])
            // Handle JSONB and vector fields
            const valuesList = records.map((r) => 
              keys.map((k) => {
                const value = r[k]
                // Format vector arrays for pgvector: [1,2,3]
                if (k === 'embedding' && Array.isArray(value)) {
                  return `[${value.join(',')}]`
                }
                return value
              })
            )
            const placeholders = records
              .map((_, i) => `(${keys.map((k, j) => {
                const paramNum = i * keys.length + j + 1
                // Cast embedding to vector type
                if (k === 'embedding') {
                  return `$${paramNum}::vector`
                }
                return `$${paramNum}`
              }).join(", ")})`)
              .join(", ")
            const flatValues = valuesList.flat()
            const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES ${placeholders} RETURNING ${columns}`
            const result = await query(sql, flatValues)
            if (result.error) throw result.error
            return { data: result.data?.[0] || null, error: null }
          },
          async then(resolve: (value: any) => any) {
            const records = Array.isArray(data) ? data : [data]
            if (records.length === 0) {
              resolve({ data: [], error: null })
              return
            }
            const keys = Object.keys(records[0])
            // Handle JSONB and vector fields
            const valuesList = records.map((r) => 
              keys.map((k) => {
                const value = r[k]
                // Format vector arrays for pgvector: [1,2,3]
                if (k === 'embedding' && Array.isArray(value)) {
                  return `[${value.join(',')}]`
                }
                return value
              })
            )
            const placeholders = records
              .map((_, i) => `(${keys.map((k, j) => {
                const paramNum = i * keys.length + j + 1
                // Cast embedding to vector type
                if (k === 'embedding') {
                  return `$${paramNum}::vector`
                }
                return `$${paramNum}`
              }).join(", ")})`)
              .join(", ")
            const flatValues = valuesList.flat()
            const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES ${placeholders} RETURNING ${columns}`
            const result = await query(sql, flatValues)
            if (result.error) {
              resolve({ data: null, error: result.error })
            } else {
              resolve({ data: result.data || [], error: null })
            }
          },
        }),
      }),
      update: (updates: Record<string, unknown>) => {
        const keys = Object.keys(updates)
        const values = Object.values(updates)
        let sql = `UPDATE ${table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(", ")}`
        const params: unknown[] = [...values]
        let paramIndex = keys.length + 1

        return {
          eq: (column: string, value: unknown) => ({
            select: (columns: string = "*") => ({
              single: async () => {
                sql += ` WHERE ${column} = $${paramIndex} RETURNING ${columns}`
                params.push(value)
                const result = await query(sql, params)
                if (result.error) throw result.error
                return { data: result.data?.[0] || null, error: null }
              },
            }),
          }),
        }
      },
      delete: () => {
        let sql = `DELETE FROM ${table}`
        const params: unknown[] = []
        let paramIndex = 1

        return {
          eq: (column: string, value: unknown) => ({
            async then(resolve: (value: any) => any) {
              sql += ` WHERE ${column} = $${paramIndex}`
              params.push(value)
              const result = await query(sql, params)
              if (result.error) {
                resolve({ error: result.error })
              } else {
                resolve({ error: null })
              }
            },
          }),
        }
      },
    }),
  }
}

export const supabase = createSupabaseLikeClient() as any

// Export getSupabase function for use in API routes
export const getSupabase = () => supabase

// Helper functions for common operations

export async function getPolicyPacks() {
  const result = await supabase
    .from("policy_packs")
    .select("*")
    .order("created_at", { ascending: false })
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data || []
}

export async function getPolicyPackById(id: string) {
  const result = await supabase
    .from("policy_packs")
    .select("*")
    .eq("id", id)
    .single()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data
}

export async function createPolicyPack(pack: {
  name: string
  version: string
  status?: string
  raw_content?: string
  description?: string
}) {
  const result = await supabase
    .from("policy_packs")
    .insert({
      ...pack,
      status: pack.status || "draft",
    })
    .select()
    .single()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data
}

export async function updatePolicyPack(id: string, updates: Record<string, unknown>) {
  const result = await supabase
    .from("policy_packs")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data
}

export async function getPolicyChunks(policyPackId?: string) {
  let sql = "SELECT * FROM policy_chunks"
  const params: unknown[] = []

  if (policyPackId) {
    sql += " WHERE policy_pack_id = $1"
    params.push(policyPackId)
  }

  const { data, error } = await query(sql, params)
  if (error) throw error
  return data || []
}

export async function createPolicyChunks(chunks: Array<{
  policy_pack_id: string
  content: string
  section_ref: string | null
  embedding: number[] | null
  metadata: Record<string, unknown>
}>) {
  const result = await supabase
    .from("policy_chunks")
    .insert(chunks)
    .select()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data || []
}

export async function searchPolicyChunks(policyPackId: string, embedding: number[], limit = 10) {
  // For now, just return all chunks for the policy pack
  // In production, use pgvector similarity search
  return getPolicyChunks(policyPackId)
}

export async function getControls(policyPackId?: string) {
  let query = supabase.from("controls").select("*")
  
  if (policyPackId) {
    query = query.eq("policy_pack_id", policyPackId)
  }

  const result = await Promise.resolve(query)
  const { data, error } = result

  if (error) throw error
  return data || []
}

export async function getEnabledControls(policyPackId?: string) {
  let query = supabase.from("controls").select("*").eq("enabled", true)
  
  if (policyPackId) {
    query = query.eq("policy_pack_id", policyPackId)
  }

  const result = await Promise.resolve(query)
  const { data, error } = result

  if (error) throw error
  return data || []
}

export async function createControls(controls: Array<{
  policy_pack_id: string
  control_id: string
  name: string
  description: string | null
  condition: Record<string, unknown>
  condition_readable: string
  action: string
  risk_weight: number
  enabled?: boolean
  source_node_ids?: string[]
  ai_reasoning: string | null
}>) {
  const result = await supabase
    .from("controls")
    .insert(controls.map(c => ({ ...c, enabled: c.enabled ?? true })))
    .select()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data || []
}

export async function deleteControlsByPolicyPack(policyPackId: string) {
  const result = await supabase
    .from("controls")
    .delete()
    .eq("policy_pack_id", policyPackId)

  const { error } = await Promise.resolve(result)
  if (error) throw error
}

export async function deletePolicyChunksByPolicyPack(policyPackId: string) {
  const result = await supabase
    .from("policy_chunks")
    .delete()
    .eq("policy_pack_id", policyPackId)

  const { error } = await Promise.resolve(result)
  if (error) throw error
}

/** Delete all review queue cases that reference this policy pack (cascade on pack delete) */
export async function deleteReviewQueueCasesByPolicyPack(policyPackId: string) {
  const result = await supabase
    .from("review_queue_cases")
    .delete()
    .eq("policy_pack_id", policyPackId)

  const { error } = await Promise.resolve(result)
  if (error) throw error
}

/** Delete review queue cases that reference this command center result (cascade on result delete) */
export async function deleteReviewQueueCasesByCommandCenterResultId(commandCenterResultId: string) {
  const result = await supabase
    .from("review_queue_cases")
    .delete()
    .eq("command_center_result_id", commandCenterResultId)

  const { error } = await Promise.resolve(result)
  if (error) throw error
}

/** Delete all command center results that reference this policy pack (cascade on pack delete) */
export async function deleteCommandCenterResultsByPolicyPack(policyPackId: string) {
  const { error } = await query(
    "DELETE FROM command_center_results WHERE policy_pack_id = $1",
    [policyPackId]
  )
  if (error) throw error
}

export async function deletePolicyPack(id: string) {
  const result = await supabase
    .from("policy_packs")
    .delete()
    .eq("id", id)

  const { error } = await Promise.resolve(result)
  if (error) throw error
}

export async function createEvent(event: {
  event_type: string
  entity_id: string
  payload: Record<string, unknown>
}) {
  const result = await supabase
    .from("events")
    .insert(event)
    .select()
    .single()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data
}

export async function createDecision(decision: {
  event_id: string
  control_id?: string
  decision: string
  risk_score?: number
  matched_conditions?: Record<string, unknown>
  ai_explanation?: string
  policy_pack_version: string
  control_snapshot?: Record<string, unknown>
}) {
  const result = await supabase
    .from("decisions")
    .insert(decision)
    .select()
    .single()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data
}

export async function createCase(caseData: {
  decision_id: string
  customer_id: string
  customer_name: string
  reason: string
  risk_score?: number
  status?: string
  assigned_to?: string
  notes?: string
}) {
  const result = await supabase
    .from("cases")
    .insert({
      ...caseData,
      status: caseData.status || "open",
    })
    .select()
    .single()
  
  const { data, error } = await Promise.resolve(result)
  if (error) throw error
  return data
}
