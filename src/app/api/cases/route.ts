import { NextRequest, NextResponse } from 'next/server'
import { getCases, createCase } from '@/lib/db'

// GET /api/cases — list all cases (lawyer dashboard)
export async function GET() {
  try {
    const cases = await getCases()
    return NextResponse.json({ data: cases })
  } catch (error) {
    console.error('[GET /api/cases]', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

// POST /api/cases — create a new case (client starts intake)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { client_name, client_email } = body

    if (!client_name?.trim()) {
      return NextResponse.json({ error: 'client_name is required' }, { status: 400 })
    }

    const newCase = await createCase({
      client_name: client_name.trim(),
      client_email: client_email?.trim(),
    })

    return NextResponse.json({ data: newCase }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/cases]', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}
