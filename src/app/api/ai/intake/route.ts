import { NextRequest, NextResponse } from 'next/server'
import { getMessagesByCaseId, getCaseById, createMessage, updateCase } from '@/lib/db'
import { generateIntakeResponse, runFullAnalysis } from '@/lib/openai'
import { applyAnalysis } from '@/lib/db'

// POST /api/ai/intake
// Receives a new client message, saves it, generates AI reply,
// and triggers full analysis when enough messages have accumulated.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { case_id, content } = body

    if (!case_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'case_id and content are required' },
        { status: 400 }
      )
    }

    const caseData = await getCaseById(case_id)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // 1. Save the client message
    await createMessage({
      case_id,
      role: 'client',
      content: content.trim(),
    })

    // 2. Increment message count
    const newCount = caseData.message_count + 1
    await updateCase(case_id, { message_count: newCount })

    // 3. Fetch full conversation history
    const allMessages = await getMessagesByCaseId(case_id)

    // 4. Generate AI intake response
    const aiReply = await generateIntakeResponse(allMessages, newCount)

    // 5. Save AI reply
    const aiMessage = await createMessage({
      case_id,
      role: 'ai',
      content: aiReply,
    })

    // 6. Trigger full analysis after 5+ client messages (run in background)
    const clientMessageCount = allMessages.filter(m => m.role === 'client').length + 1
    let analysisTriggered = false

    if (clientMessageCount >= 5 && !caseData.intake_complete) {
      try {
        const analysis = await runFullAnalysis(allMessages)
        await applyAnalysis(case_id, analysis)
        analysisTriggered = true
      } catch (analysisError) {
        console.error('Analysis failed (non-critical):', analysisError)
      }
    }

    return NextResponse.json({
      data: {
        message: aiMessage,
        analysisTriggered,
        messageCount: newCount,
      },
    })
  } catch (error) {
    console.error('[POST /api/ai/intake]', error)
    return NextResponse.json({ error: 'Failed to process intake message' }, { status: 500 })
  }
}
