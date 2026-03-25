'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, MessageSquare, FileText, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge, ViabilityBadge } from '@/components/ui/Badge'
import type { Case } from '@/lib/types'

interface CaseCardProps {
  caseData: Case
}

export function CaseCard({ caseData }: CaseCardProps) {
  const router = useRouter()

  function handleOpen() {
    router.push(`/lawyer/case/${caseData.id}`)
  }

  return (
    <Card hover onClick={handleOpen} className="group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {caseData.client_name}
            </h3>
            <StatusBadge status={caseData.status} />
            {caseData.viability_score && (
              <ViabilityBadge score={caseData.viability_score} />
            )}
          </div>

          {/* Legal category */}
          {caseData.legal_category && (
            <p className="text-xs text-gray-500">
              {caseData.legal_category}
              {caseData.legal_subcategory && (
                <span className="text-gray-400"> · {caseData.legal_subcategory}</span>
              )}
            </p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {/* Summary excerpt */}
      {caseData.summary ? (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
          {/* Strip markdown headers for preview */}
          {caseData.summary
            .replace(/##+ .+\n/g, '')
            .replace(/\*\*/g, '')
            .trim()
            .slice(0, 180)}
          {caseData.summary.length > 180 && '...'}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic mb-3">
          Intake in progress — analysis pending
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {caseData.message_count} messages
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(caseData.created_at), { addSuffix: true })}
          </span>
        </div>

        {caseData.client_email && (
          <span className="text-xs text-gray-400 truncate max-w-[160px]">
            {caseData.client_email}
          </span>
        )}
      </div>
    </Card>
  )
}
