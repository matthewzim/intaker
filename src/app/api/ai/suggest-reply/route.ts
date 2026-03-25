import { NextRequest, NextResponse } from 'next/server'
import { getMessagesByCaseId, getCaseById } from '@/lib/db'
import { suggestLawyerReply } from '@/lib/openai'

// POST /api/ai/suggest-reply — generate an AI-suggested reply for the lawyer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { case_id } = body

    if (!case_id) {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }

    const [caseData, messages] = await Promise.all([
      getCaseById(case_id),
      getMessagesByCaseId(case_id),
    ])

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const suggestion = await suggestLawyerReply(
      messages,
      caseData.summary ?? 'No summary available yet.'
    )

    return NextResponse.json({ data: { suggestion } })
  } catch (error) {
    console.error('[POST /api/ai/suggest-reply]', error)
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 })
  }
}
