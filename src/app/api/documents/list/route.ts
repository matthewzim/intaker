import { NextRequest, NextResponse } from 'next/server'
import { getDocumentsByCaseId } from '@/lib/db'

// GET /api/documents/list?case_id=xxx — list all documents for a case
export async function GET(req: NextRequest) {
  try {
    const caseId = req.nextUrl.searchParams.get('case_id')
    if (!caseId) {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }

    const docs = await getDocumentsByCaseId(caseId)
    return NextResponse.json({ data: docs })
  } catch (error) {
    console.error('[GET /api/documents/list]', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
