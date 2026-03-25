import { notFound } from 'next/navigation'
import { getCaseById } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { ChatPane } from '@/components/workspace/ChatPane'
import { SummaryPane } from '@/components/workspace/SummaryPane'
import { DocumentPane } from '@/components/workspace/DocumentPane'
import { StatusBadge, ViabilityBadge } from '@/components/ui/Badge'

interface Props {
  params: { id: string }
}

export default async function LawyerCasePage({ params }: Props) {
  const caseData = await getCaseById(params.id)

  if (!caseData) {
    notFound()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        currentRole="lawyer"
        caseId={caseData.id}
        caseName={caseData.client_name}
      />

      {/* Sub-header with case info */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{caseData.client_name}</span>
              {caseData.client_email && (
                <a
                  href={`mailto:${caseData.client_email}`}
                  className="text-xs text-violet-600 hover:underline"
                >
                  {caseData.client_email}
                </a>
              )}
            </div>
            {caseData.legal_category && (
              <p className="text-xs text-gray-500">
                {caseData.legal_category}
                {caseData.legal_subcategory && ` · ${caseData.legal_subcategory}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={caseData.status} />
          {caseData.viability_score && (
            <ViabilityBadge score={caseData.viability_score} />
          )}
        </div>
      </div>

      {/* Workspace layout: Left chat | Right summary + docs stacked */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Chat (wider) */}
        <div className="flex-1 border-r border-gray-200 flex flex-col min-w-0 overflow-hidden">
          <ChatPane caseData={caseData} role="lawyer" />
        </div>

        {/* Right: Summary + Documents (fixed width, scrollable) */}
        <div className="w-96 flex flex-col overflow-hidden shrink-0">
          {/* Summary takes top portion */}
          <div className="flex-1 border-b border-gray-200 overflow-hidden flex flex-col">
            <SummaryPane caseData={caseData} role="lawyer" />
          </div>

          {/* Documents takes bottom portion */}
          <div className="h-72 flex flex-col overflow-hidden">
            <DocumentPane caseId={caseData.id} role="lawyer" />
          </div>
        </div>
      </div>
    </div>
  )
}
