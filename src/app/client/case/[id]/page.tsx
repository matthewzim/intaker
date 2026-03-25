import { notFound } from 'next/navigation'
import { getCaseById } from '@/lib/db'
import { IntakeChat } from '@/components/client/IntakeChat'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Scale, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function ClientCasePage({ params }: Props) {
  const caseData = await getCaseById(params.id)

  if (!caseData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentRole="client" caseId={caseData.id} caseName={`Case #${caseData.id.slice(0, 8)}`} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {/* Case status strip */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{caseData.client_name}</p>
              <p className="text-xs text-gray-500">
                {caseData.legal_category ?? 'Pending classification'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={caseData.status} />
            <Link
              href={`/client/case/${caseData.id}/documents`}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Docs
            </Link>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden flex flex-col"
          style={{ minHeight: 'calc(100vh - 220px)' }}>
          <IntakeChat caseData={caseData} />
        </div>
      </div>
    </div>
  )
}
