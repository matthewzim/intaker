import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getDocumentById, updateDocument } from '@/lib/db'
import { summarizeDocument } from '@/lib/openai'

// POST /api/documents/[id]/summarize — trigger AI summary of a document
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await getDocumentById(params.id)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Read file content from disk
    const fullPath = path.join(process.cwd(), 'public', doc.file_path)

    let documentText = ''
    try {
      const buffer = await readFile(fullPath)
      // For text-based files, convert to string
      if (
        doc.file_type.includes('text') ||
        doc.file_type.includes('json') ||
        doc.file_type.includes('csv')
      ) {
        documentText = buffer.toString('utf-8')
      } else {
        // For PDFs/images, we can only summarize based on filename metadata
        documentText = `[Binary file: ${doc.original_name} (${doc.file_type}, ${Math.round(doc.file_size / 1024)}KB)]`
      }
    } catch {
      documentText = `[File: ${doc.original_name}]`
    }

    const { summary, tags } = await summarizeDocument(documentText, doc.original_name)

    const updated = await updateDocument(params.id, { summary, tags })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[POST /api/documents/:id/summarize]', error)
    return NextResponse.json({ error: 'Failed to summarize document' }, { status: 500 })
  }
}
