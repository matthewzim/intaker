/**
 * OpenAI service layer — all AI prompts and API calls live here.
 * Uses GPT-4o for all completions.
 */

import OpenAI from 'openai'
import type { Message, ExtractedFacts, ViabilityScore, CaseAnalysis } from './types'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.warn('Warning: OPENAI_API_KEY is not set. AI features will be disabled.')
}

const openai = new OpenAI({ apiKey: apiKey ?? 'missing' })

const MODEL = 'gpt-4o'

// ─── Intake Chat ──────────────────────────────────────────────────────────────

/**
 * Generates an AI response during the conversational intake.
 * The AI acts as a compassionate legal intake specialist, asking follow-up
 * questions to gather a complete picture of the client's legal matter.
 */
export async function generateIntakeResponse(
  conversationHistory: Message[],
  messageCount: number
): Promise<string> {
  const systemPrompt = `You are a compassionate and professional legal intake specialist for a law firm.
Your role is to gather comprehensive information about a potential client's legal matter through natural conversation.

Guidelines:
- Start by acknowledging their situation with empathy
- Ask one focused follow-up question at a time (don't overwhelm with multiple questions)
- Gather: who is involved, what happened, when it happened, where it occurred, and what harm was caused
- Be warm, professional, and reassuring
- After ${messageCount >= 8 ? 'the client has shared enough information' : '5-8 exchanges'}, let them know their information is being reviewed by the legal team
- Never provide legal advice or predictions — only gather facts
- Keep responses concise (2-4 sentences + follow-up question)

Current message count: ${messageCount}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory
      .filter(m => m.role !== 'lawyer')
      .map(m => ({
        role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
  ]

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 300,
    temperature: 0.7,
  })

  return completion.choices[0].message.content ?? 'I apologize, I had trouble processing that. Could you please rephrase?'
}

// ─── Fact Extraction ──────────────────────────────────────────────────────────

/**
 * Extracts structured legal facts from the conversation history.
 * Returns a JSON object with parties, timeline, key events, damages, and jurisdiction.
 */
export async function extractFacts(
  conversationHistory: Message[]
): Promise<ExtractedFacts> {
  const conversationText = conversationHistory
    .filter(m => m.role !== 'lawyer')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')

  const prompt = `Extract structured legal facts from the following conversation between a client and a legal intake specialist.
Return a JSON object with these exact fields:
- parties: array of strings describing each party involved (e.g., ["John Smith (plaintiff)", "ABC Corp (defendant)"])
- timeline: array of strings with dated events in chronological order (e.g., ["January 2024: Contract signed", "March 2024: Dispute arose"])
- key_events: array of strings describing the most legally significant events
- damages: array of strings describing alleged damages or harm (financial, physical, emotional)
- jurisdiction: string indicating the likely jurisdiction (state, federal, etc.) if determinable

Return ONLY valid JSON, no explanation. Use empty arrays if information is not available.

CONVERSATION:
${conversationText}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.2,
    })

    const content = completion.choices[0].message.content ?? '{}'
    return JSON.parse(content) as ExtractedFacts
  } catch {
    return {
      parties: [],
      timeline: [],
      key_events: [],
      damages: [],
      jurisdiction: 'Unknown',
    }
  }
}

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Classifies the legal issue into a category and subcategory.
 */
export async function classifyLegalIssue(
  conversationHistory: Message[]
): Promise<{ legal_category: string; legal_subcategory: string }> {
  const conversationText = conversationHistory
    .filter(m => m.role !== 'lawyer')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')

  const prompt = `Classify this legal issue into a category and subcategory. Return concise labels.

Common categories: Employment Law, Personal Injury, Contract Dispute, Family Law, Criminal Defense,
Real Estate, Immigration, Intellectual Property, Business Law, Consumer Protection, Civil Rights, Other

Return JSON with exactly: { "legal_category": "...", "legal_subcategory": "..." }

CONVERSATION:
${conversationText}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 100,
      temperature: 0.1,
    })

    const content = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(content)
    return {
      legal_category: result.legal_category ?? 'Unknown',
      legal_subcategory: result.legal_subcategory ?? 'Unknown',
    }
  } catch {
    return { legal_category: 'Unknown', legal_subcategory: 'Unknown' }
  }
}

// ─── Viability Assessment ─────────────────────────────────────────────────────

/**
 * Assesses the likely legal strength of the case.
 * Returns Strong / Medium / Weak with short reasoning.
 */
export async function assessViability(
  conversationHistory: Message[],
  extractedFacts: ExtractedFacts
): Promise<{ viability_score: ViabilityScore; viability_reasoning: string }> {
  const factsText = JSON.stringify(extractedFacts, null, 2)

  const prompt = `Assess the likely legal strength of this case based on the facts provided.

EXTRACTED FACTS:
${factsText}

Assess the case and return JSON with:
- score: exactly one of "strong", "medium", or "weak"
- reasoning: 2-3 sentences explaining the assessment, noting key strengths, weaknesses, and what additional information would be helpful

Consider: clarity of harm, availability of evidence, legal precedent, statute of limitations concerns, and damages.

Return ONLY valid JSON: { "score": "...", "reasoning": "..." }`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.3,
    })

    const content = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(content)
    const score = (['strong', 'medium', 'weak'].includes(result.score)
      ? result.score
      : 'medium') as ViabilityScore

    return {
      viability_score: score,
      viability_reasoning: result.reasoning ?? 'Unable to assess at this time.',
    }
  } catch {
    return {
      viability_score: 'medium',
      viability_reasoning: 'Assessment pending further information.',
    }
  }
}

// ─── Intake Summary ───────────────────────────────────────────────────────────

/**
 * Generates a professional intake summary for the lawyer.
 */
export async function generateSummary(
  conversationHistory: Message[],
  extractedFacts: ExtractedFacts,
  legalCategory: string
): Promise<string> {
  const conversationText = conversationHistory
    .filter(m => m.role !== 'lawyer')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')

  const prompt = `Generate a concise, professional intake summary for a lawyer reviewing this ${legalCategory} case.

CONVERSATION:
${conversationText}

EXTRACTED FACTS:
${JSON.stringify(extractedFacts, null, 2)}

Format the summary in clean markdown with these sections:
## Case Overview
[2-3 sentence overview]

## Key Facts
[Bulleted list of the most important facts]

## Legal Issues
[The primary legal issues and potential claims]

## Risks & Weaknesses
[Any concerns, gaps in evidence, or legal risks]

## Missing Information
[What additional information would strengthen the case]

Keep it concise and professional — this is for a busy attorney's first review.`

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.4,
  })

  return completion.choices[0].message.content ?? 'Summary generation failed. Please try again.'
}

// ─── Document Summary ─────────────────────────────────────────────────────────

/**
 * Summarizes a document and extracts legally relevant facts.
 */
export async function summarizeDocument(
  documentText: string,
  filename: string
): Promise<{ summary: string; tags: string[] }> {
  const prompt = `Summarize this legal document and extract legally relevant facts.

DOCUMENT: ${filename}
CONTENT:
${documentText.slice(0, 6000)} ${documentText.length > 6000 ? '\n[... document truncated for analysis ...]' : ''}

Return JSON with:
- summary: A concise 2-4 sentence summary of what this document is and its legal significance
- tags: Array of 1-5 descriptive tags from this list: ["contract", "evidence", "medical", "financial", "correspondence", "legal filing", "photo", "police report", "witness statement", "other"]

Return ONLY valid JSON: { "summary": "...", "tags": [...] }`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.3,
    })

    const content = completion.choices[0].message.content ?? '{}'
    const result = JSON.parse(content)
    return {
      summary: result.summary ?? 'Document uploaded.',
      tags: Array.isArray(result.tags) ? result.tags : [],
    }
  } catch {
    return { summary: 'Document uploaded. Summary unavailable.', tags: [] }
  }
}

// ─── Full Analysis Pipeline ───────────────────────────────────────────────────

/**
 * Runs all AI analysis steps in parallel for maximum efficiency.
 * Called automatically after the intake reaches sufficient depth.
 */
export async function runFullAnalysis(
  conversationHistory: Message[]
): Promise<CaseAnalysis> {
  // Run fact extraction and classification in parallel
  const [facts, classification] = await Promise.all([
    extractFacts(conversationHistory),
    classifyLegalIssue(conversationHistory),
  ])

  // Viability and summary depend on facts
  const [viability, summary] = await Promise.all([
    assessViability(conversationHistory, facts),
    generateSummary(conversationHistory, facts, classification.legal_category),
  ])

  return {
    extracted_facts: facts,
    legal_category: classification.legal_category,
    legal_subcategory: classification.legal_subcategory,
    viability_score: viability.viability_score,
    viability_reasoning: viability.viability_reasoning,
    summary,
  }
}

// ─── Reply Suggestion ────────────────────────────────────────────────────────

/**
 * Suggests a reply for the lawyer based on conversation context.
 */
export async function suggestLawyerReply(
  conversationHistory: Message[],
  caseSummary: string
): Promise<string> {
  const recentMessages = conversationHistory.slice(-6)
  const messagesText = recentMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')

  const prompt = `You are helping a lawyer draft a professional response to their client.

CASE SUMMARY:
${caseSummary}

RECENT CONVERSATION:
${messagesText}

Write a professional, empathetic reply from the lawyer to the client.
- Keep it concise (2-4 sentences)
- Be professional but accessible
- Address the client's most recent concern or question
- Do not provide specific legal advice or predictions about outcomes`

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.6,
  })

  return completion.choices[0].message.content ?? ''
}
