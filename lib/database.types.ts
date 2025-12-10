// Database types for Supabase
// This file would be auto-generated in production using: supabase gen types typescript

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      policy_packs: {
        Row: {
          id: string
          name: string
          version: string
          status: string
          raw_content: string | null
          description: string | null
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          name: string
          version: string
          status?: string
          raw_content?: string | null
          description?: string | null
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          version?: string
          status?: string
          raw_content?: string | null
          description?: string | null
          created_at?: string
          published_at?: string | null
        }
      }
      policy_chunks: {
        Row: {
          id: string
          policy_pack_id: string
          content: string
          section_ref: string | null
          embedding: number[] | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          policy_pack_id: string
          content: string
          section_ref?: string | null
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          policy_pack_id?: string
          content?: string
          section_ref?: string | null
          embedding?: number[] | null
          metadata?: Json
          created_at?: string
        }
      }
      controls: {
        Row: {
          id: string
          policy_pack_id: string
          control_id: string
          name: string
          description: string | null
          condition: Json
          condition_readable: string
          action: string
          risk_weight: number
          enabled: boolean
          source_node_ids: string[]
          ai_reasoning: string | null
          created_at: string
        }
        Insert: {
          id?: string
          policy_pack_id: string
          control_id: string
          name: string
          description?: string | null
          condition: Json
          condition_readable: string
          action: string
          risk_weight?: number
          enabled?: boolean
          source_node_ids?: string[]
          ai_reasoning?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          policy_pack_id?: string
          control_id?: string
          name?: string
          description?: string | null
          condition?: Json
          condition_readable?: string
          action?: string
          risk_weight?: number
          enabled?: boolean
          source_node_ids?: string[]
          ai_reasoning?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_type: string
          entity_id: string
          payload: Json
          received_at: string
        }
        Insert: {
          id?: string
          event_type: string
          entity_id: string
          payload: Json
          received_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          entity_id?: string
          payload?: Json
          received_at?: string
        }
      }
      decisions: {
        Row: {
          id: string
          event_id: string
          control_id: string | null
          decision: string
          risk_score: number | null
          matched_conditions: Json | null
          ai_explanation: string | null
          created_at: string
          policy_pack_version: string
          control_snapshot: Json | null
        }
        Insert: {
          id?: string
          event_id: string
          control_id?: string | null
          decision: string
          risk_score?: number | null
          matched_conditions?: Json | null
          ai_explanation?: string | null
          created_at?: string
          policy_pack_version: string
          control_snapshot?: Json | null
        }
        Update: {
          // Decisions are immutable - updates not allowed
          id?: never
          event_id?: never
          control_id?: never
          decision?: never
          risk_score?: never
          matched_conditions?: never
          ai_explanation?: never
          created_at?: never
          policy_pack_version?: never
          control_snapshot?: never
        }
      }
      cases: {
        Row: {
          id: string
          decision_id: string
          customer_id: string
          customer_name: string
          reason: string
          risk_score: number | null
          status: string
          resolution: string | null
          assigned_to: string | null
          notes: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          decision_id: string
          customer_id: string
          customer_name: string
          reason: string
          risk_score?: number | null
          status?: string
          resolution?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          decision_id?: string
          customer_id?: string
          customer_name?: string
          reason?: string
          risk_score?: number | null
          status?: string
          resolution?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

