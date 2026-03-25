import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, updateCase } from '@/lib/db'
import type { CaseStatus } from '@/lib/types'

// GET /api/cases/[id] — get a single case
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseData = await getCaseById(params.id)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    return NextResponse.json({ data: caseData })
  } catch (error) {
    console.error('[GET /api/cases/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

// PATCH /api/cases/[id] — update case fields (status, summary override, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    // Validate status if provided
    const validStatuses: CaseStatus[] = ['new', 'reviewing', 'accepted', 'rejected']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const updated = await updateCase(params.id, body)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/cases/:id]', error)
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}
