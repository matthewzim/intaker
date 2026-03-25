/**
 * Database helper functions — thin wrappers around Supabase queries.
 * All functions are server-side only (used in API routes).
 */

import { createServerClient } from './supabase'
import type { Case, Message, Document, CaseStatus, CaseAnalysis } from './types'

// ─── Cases ───────────────────────────────────────────────────────────────────

export async function getCases(): Promise<Case[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Case[]
}

export async function getCaseById(id: string): Promise<Case | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('cases')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Case
}

export async function createCase(input: {
  client_name: string
  client_email?: string
}): Promise<Case> {
  const db = createServerClient()
  const { data, error } = await db
    .from('cases')
    .insert({
      client_name: input.client_name,
      client_email: input.client_email,
      status: 'new',
      message_count: 0,
      intake_complete: false,
      extracted_facts: {},
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Case
}

export async function updateCase(
  id: string,
  updates: Partial<Case>
): Promise<Case> {
  const db = createServerClient()
  const { data, error } = await db
    .from('cases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Case
}

export async function updateCaseStatus(
  id: string,
  status: CaseStatus
): Promise<Case> {
  return updateCase(id, { status })
}

export async function applyAnalysis(
  id: string,
  analysis: CaseAnalysis
): Promise<Case> {
  return updateCase(id, {
    extracted_facts: analysis.extracted_facts,
    legal_category: analysis.legal_category,
    legal_subcategory: analysis.legal_subcategory,
    viability_score: analysis.viability_score,
    viability_reasoning: analysis.viability_reasoning,
    summary: analysis.summary,
    intake_complete: true,
  })
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessagesByCaseId(caseId: string): Promise<Message[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Message[]
}

export async function createMessage(input: {
  case_id: string
  role: Message['role']
  content: string
  message_type?: Message['message_type']
}): Promise<Message> {
  const db = createServerClient()
  const { data, error } = await db
    .from('messages')
    .insert({
      case_id: input.case_id,
      role: input.role,
      content: input.content,
      message_type: input.message_type ?? 'chat',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Increment message_count (read-then-write; race condition acceptable for MVP)
  const { data: caseRow } = await db
    .from('cases')
    .select('message_count')
    .eq('id', input.case_id)
    .single()

  if (caseRow) {
    await db
      .from('cases')
      .update({ message_count: ((caseRow as { message_count: number }).message_count ?? 0) + 1 })
      .eq('id', input.case_id)
      .catch(() => {}) // non-critical; intake API also increments
  }

  return data as Message
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocumentsByCaseId(caseId: string): Promise<Document[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('documents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Document[]
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Document
}

export async function createDocument(input: {
  case_id: string
  filename: string
  original_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: 'client' | 'lawyer'
}): Promise<Document> {
  const db = createServerClient()
  const { data, error } = await db
    .from('documents')
    .insert({ ...input, tags: [] })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Document
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<Document> {
  const db = createServerClient()
  const { data, error } = await db
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Document
}

export async function deleteDocument(id: string): Promise<void> {
  const db = createServerClient()
  const { error } = await db.from('documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
