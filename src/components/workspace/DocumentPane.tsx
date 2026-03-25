'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  Sparkles,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { TagBadge } from '@/components/ui/Badge'
import type { Document } from '@/lib/types'

interface DocumentPaneProps {
  caseId: string
  role: 'client' | 'lawyer'
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />
  if (fileType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />
  return <File className="w-4 h-4 text-gray-400" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function DocumentRow({ doc, onDelete, onSummarize }: {
  doc: Document
  onDelete: (id: string) => void
  onSummarize: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [summarizing, setSummarizing] = useState(false)

  async function handleSummarize() {
    setSummarizing(true)
    await onSummarize(doc.id)
    setSummarizing(false)
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Row header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <FileIcon fileType={doc.file_type} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{doc.original_name}</p>
          <p className="text-xs text-gray-400">
            {formatFileSize(doc.file_size)} ·{' '}
            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Tags */}
          <div className="hidden sm:flex gap-1 flex-wrap">
            {doc.tags.slice(0, 2).map(tag => (
              <TagBadge key={tag} label={tag} />
            ))}
          </div>

          {/* Actions */}
          {!doc.summary && (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 transition-colors"
              title="AI Summarize"
            >
              {summarizing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          )}

          <a
            href={doc.file_path}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded: summary + tags */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2 animate-fade-in">
          {doc.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {doc.tags.map(tag => (
                <TagBadge key={tag} label={tag} />
              ))}
            </div>
          )}
          {doc.summary ? (
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2">
              {doc.summary}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Click the sparkle icon to generate an AI summary of this document.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function DocumentPane({ caseId, role }: DocumentPaneProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  useEffect(() => {
    fetchDocuments()
  }, [caseId])

  async function fetchDocuments() {
    try {
      // Fetch docs via messages API workaround — use the documents endpoint
      const res = await fetch(`/api/documents/list?case_id=${caseId}`)
      const json = await res.json()
      if (json.data) setDocuments(json.data)
    } catch {
      // Silently fail
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)

    for (const file of acceptedFiles) {
      setUploadProgress(`Uploading ${file.name}...`)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('case_id', caseId)
        formData.append('uploaded_by', role)

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })
        const json = await res.json()
        if (json.data) {
          setDocuments(prev => [json.data, ...prev])
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }

    setUploading(false)
    setUploadProgress('')
  }, [caseId, role])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  async function handleSummarize(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}/summarize`, { method: 'POST' })
      const json = await res.json()
      if (json.data) {
        setDocuments(prev => prev.map(d => d.id === docId ? json.data : d))
      }
    } catch (error) {
      console.error('Summarize failed:', error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
        <p className="text-xs text-gray-500">{documents.length} file{documents.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-all',
            isDragActive
              ? 'border-violet-400 bg-violet-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            uploading && 'opacity-50 pointer-events-none'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={clsx(
            'w-6 h-6 mx-auto mb-2',
            isDragActive ? 'text-violet-500' : 'text-gray-400'
          )} />
          {uploading ? (
            <p className="text-sm text-gray-600">{uploadProgress}</p>
          ) : isDragActive ? (
            <p className="text-sm text-violet-600 font-medium">Drop files here</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                Drop files here or <span className="text-violet-600">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, images, docs · Max 10MB each</p>
            </>
          )}
        </div>

        {/* Document list */}
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No documents yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Upload relevant files above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onDelete={handleDelete}
                onSummarize={handleSummarize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
