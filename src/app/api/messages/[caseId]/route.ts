import { NextRequest, NextResponse } from 'next/server'
import { getMessagesByCaseId } from '@/lib/db'

// GET /api/messages/[caseId] — fetch all messages for a case
export async function GET(
  _req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const messages = await getMessagesByCaseId(params.caseId)
    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error('[GET /api/messages/:caseId]', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
