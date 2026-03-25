import { NextRequest, NextResponse } from 'next/server'
import { createMessage, getCaseById } from '@/lib/db'
import type { MessageRole } from '@/lib/types'

// POST /api/messages — send a message to a case thread
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { case_id, role, content, message_type } = body

    if (!case_id || !role || !content?.trim()) {
      return NextResponse.json(
        { error: 'case_id, role, and content are required' },
        { status: 400 }
      )
    }

    const validRoles: MessageRole[] = ['client', 'ai', 'lawyer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify case exists
    const caseData = await getCaseById(case_id)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const message = await createMessage({
      case_id,
      role,
      content: content.trim(),
      message_type: message_type ?? 'chat',
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/messages]', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
