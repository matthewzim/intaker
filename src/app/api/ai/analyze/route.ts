import { NextRequest, NextResponse } from 'next/server'
import { getMessagesByCaseId, getCaseById, applyAnalysis } from '@/lib/db'
import { runFullAnalysis } from '@/lib/openai'

// POST /api/ai/analyze — manually trigger full AI analysis for a case
// Useful when lawyer wants to re-run analysis or force an update
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { case_id } = body

    if (!case_id) {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }

    const caseData = await getCaseById(case_id)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const messages = await getMessagesByCaseId(case_id)

    if (messages.length < 2) {
      return NextResponse.json(
        { error: 'Not enough conversation to analyze' },
        { status: 422 }
      )
    }

    const analysis = await runFullAnalysis(messages)
    const updatedCase = await applyAnalysis(case_id, analysis)

    return NextResponse.json({ data: updatedCase })
  } catch (error) {
    console.error('[POST /api/ai/analyze]', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
