// Supabase client for server-side operations
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL environment variable")
}

// For direct Postgres connection
export const getPostgresUrl = () => process.env.POSTGRES_URL!

// Create Supabase client (will use PostgREST API)
const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:3000"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2NDQwMDAwfQ.0"

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper functions for common operations

export async function getPolicyPacks() {
  const { data, error } = await supabase
    .from("policy_packs")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getPolicyPackById(id: string) {
  const { data, error } = await supabase
    .from("policy_packs")
    .select("*")
    .eq("id", id)
    .single()

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
  const { data, error } = await supabase
    .from("policy_packs")
    .insert({
      ...pack,
      status: pack.status || "draft",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePolicyPack(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("policy_packs")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPolicyChunks(policyPackId: string) {
  const { data, error } = await supabase
    .from("policy_chunks")
    .select("*")
    .eq("policy_pack_id", policyPackId)

  if (error) throw error
  return data
}

export async function createPolicyChunks(chunks: Array<{
  policy_pack_id: string
  content: string
  section_ref: string | null
  embedding: number[] | null
  metadata: Record<string, unknown>
}>) {
  const { data, error } = await supabase
    .from("policy_chunks")
    .insert(chunks)
    .select()

  if (error) throw error
  return data
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

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getEnabledControls(policyPackId?: string) {
  let query = supabase.from("controls").select("*").eq("enabled", true)
  
  if (policyPackId) {
    query = query.eq("policy_pack_id", policyPackId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
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
  const { data, error } = await supabase
    .from("controls")
    .insert(controls.map(c => ({ ...c, enabled: c.enabled ?? true })))
    .select()

  if (error) throw error
  return data
}

export async function deleteControlsByPolicyPack(policyPackId: string) {
  const { error } = await supabase
    .from("controls")
    .delete()
    .eq("policy_pack_id", policyPackId)

  if (error) throw error
}

export async function createEvent(event: {
  event_type: string
  entity_id: string
  payload: Record<string, unknown>
}) {
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select()
    .single()

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
  const { data, error } = await supabase
    .from("decisions")
    .insert(decision)
    .select()
    .single()

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
  const { data, error } = await supabase
    .from("cases")
    .insert({
      ...caseData,
      status: caseData.status || "open",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

