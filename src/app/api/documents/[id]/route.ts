import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { getDocumentById, deleteDocument } from '@/lib/db'

// GET /api/documents/[id] — get document metadata
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await getDocumentById(params.id)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    return NextResponse.json({ data: doc })
  } catch (error) {
    console.error('[GET /api/documents/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

// DELETE /api/documents/[id] — delete a document
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await getDocumentById(params.id)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete from filesystem
    const fullPath = path.join(process.cwd(), 'public', doc.file_path)
    await unlink(fullPath).catch(() => {
      // Ignore if file already deleted
    })

    // Delete from database
    await deleteDocument(params.id)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('[DELETE /api/documents/:id]', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
