import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { createDocument } from '@/lib/db'

// POST /api/documents — upload a document to a case
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const caseId = formData.get('case_id') as string | null
    const uploadedBy = (formData.get('uploaded_by') as string) || 'client'

    if (!file || !caseId) {
      return NextResponse.json(
        { error: 'file and case_id are required' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      )
    }

    // Build safe filename
    const ext = path.extname(file.name) || ''
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', caseId)

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(uploadDir, safeName)
    await writeFile(filePath, buffer)

    // Store metadata in database
    const doc = await createDocument({
      case_id: caseId,
      filename: safeName,
      original_name: file.name,
      file_path: `/uploads/${caseId}/${safeName}`,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: uploadedBy as 'client' | 'lawyer',
    })

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/documents]', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
