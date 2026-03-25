import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCaseById } from '@/lib/db'
import { Header } from '@/components/layout/Header'
import { DocumentPane } from '@/components/workspace/DocumentPane'
import { SummaryPane } from '@/components/workspace/SummaryPane'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function ClientDocumentsPage({ params }: Props) {
  const caseData = await getCaseById(params.id)

  if (!caseData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentRole="client" caseId={caseData.id} caseName={caseData.client_name} />

      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <Link
          href={`/client/case/${caseData.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to chat
        </Link>

        <h1 className="text-xl font-semibold text-gray-900 mb-6">Your Case Workspace</h1>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden h-[500px] flex flex-col">
            <DocumentPane caseId={caseData.id} role="client" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden h-[500px] flex flex-col">
            <SummaryPane caseData={caseData} role="client" />
          </div>
        </div>
      </div>
    </div>
  )
}
