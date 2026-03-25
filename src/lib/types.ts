/**
 * Core TypeScript types for Caseflow
 */

// ─── Case ────────────────────────────────────────────────────────────────────

export type CaseStatus = 'new' | 'reviewing' | 'accepted' | 'rejected'
export type ViabilityScore = 'strong' | 'medium' | 'weak'

export interface ExtractedFacts {
  parties?: string[]
  timeline?: string[]
  key_events?: string[]
  damages?: string[]
  jurisdiction?: string
  [key: string]: unknown
}

export interface Case {
  id: string
  created_at: string
  updated_at: string
  client_name: string
  client_email?: string
  status: CaseStatus
  legal_category?: string
  legal_subcategory?: string
  viability_score?: ViabilityScore
  viability_reasoning?: string
  summary?: string
  extracted_facts: ExtractedFacts
  intake_complete: boolean
  message_count: number
}

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageRole = 'client' | 'ai' | 'lawyer'
export type MessageType = 'chat' | 'system' | 'summary_update'

export interface Message {
  id: string
  created_at: string
  case_id: string
  role: MessageRole
  content: string
  message_type: MessageType
}

// ─── Documents ───────────────────────────────────────────────────────────────

export interface Document {
  id: string
  created_at: string
  case_id: string
  filename: string
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  summary?: string
  tags: string[]
  uploaded_by: 'client' | 'lawyer'
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export interface CaseAnalysis {
  extracted_facts: ExtractedFacts
  legal_category: string
  legal_subcategory: string
  viability_score: ViabilityScore
  viability_reasoning: string
  summary: string
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}
