'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Edit3, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { StatusBadge, ViabilityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Case, CaseStatus, ViabilityScore } from '@/lib/types'

interface SummaryPaneProps {
  caseData: Case
  role: 'client' | 'lawyer'
  onUpdate?: (updatedCase: Case) => void
}

// Render markdown summary sections
function MarkdownSummary({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-1.5 first:mt-0">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
          <span className="text-gray-400 shrink-0 mt-1.5">•</span>
          <span>{line.slice(2)}</span>
        </div>
      )
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed">
          {line}
        </p>
      )
    }
  })

  return <div className="space-y-0.5">{elements}</div>
}

// Collapsible section
function Section({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

export function SummaryPane({ caseData, role, onUpdate }: SummaryPaneProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>(caseData.status)
  const [savingStatus, setSavingStatus] = useState(false)
  const [localCase, setLocalCase] = useState(caseData)

  async function runAnalysis() {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseData.id }),
      })
      const json = await res.json()
      if (json.data) {
        setLocalCase(json.data)
        onUpdate?.(json.data)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function saveStatus() {
    setSavingStatus(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })
      const json = await res.json()
      if (json.data) {
        setLocalCase(prev => ({ ...prev, status: json.data.status }))
        onUpdate?.(json.data)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setSavingStatus(false)
      setEditingStatus(false)
    }
  }

  const statuses: CaseStatus[] = ['new', 'reviewing', 'accepted', 'rejected']
  const statusLabels: Record<CaseStatus, string> = {
    new: 'New',
    reviewing: 'Reviewing',
    accepted: 'Accepted',
    rejected: 'Rejected',
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Case Summary</h3>
        {role === 'lawyer' && (
          <Button
            variant="ghost"
            size="sm"
            loading={isAnalyzing}
            onClick={runAnalysis}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll px-4 py-2">

        {/* Case status + viability */}
        <Section title="Status">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              {!editingStatus ? (
                <div className="flex items-center gap-2">
                  <StatusBadge status={localCase.status} />
                  {role === 'lawyer' && (
                    <button
                      onClick={() => { setEditingStatus(true); setSelectedStatus(localCase.status) }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value as CaseStatus)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveStatus}
                    disabled={savingStatus}
                    className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="p-1 rounded hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {localCase.viability_score && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Viability</span>
                <ViabilityBadge score={localCase.viability_score} />
              </div>
            )}

            {localCase.viability_reasoning && (
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
                {localCase.viability_reasoning}
              </p>
            )}
          </div>
        </Section>

        {/* Legal classification */}
        {(localCase.legal_category || localCase.legal_subcategory) && (
          <Section title="Classification">
            <div className="space-y-1.5">
              {localCase.legal_category && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs font-medium text-gray-800">{localCase.legal_category}</span>
                </div>
              )}
              {localCase.legal_subcategory && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Subcategory</span>
                  <span className="text-xs font-medium text-gray-800">{localCase.legal_subcategory}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* AI-generated summary */}
        {localCase.summary ? (
          <Section title="Intake Summary">
            <div className="bg-gray-50 rounded-lg p-3">
              <MarkdownSummary content={localCase.summary} />
            </div>
          </Section>
        ) : (
          <Section title="Intake Summary">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-10 h-10 bg-violet-50 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Analysis pending</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Summary will appear after{' '}
                  {role === 'lawyer' ? 'you trigger analysis or after 5+ client messages' : '5+ messages in the intake chat'}
                </p>
              </div>
              {role === 'lawyer' && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isAnalyzing}
                  onClick={runAnalysis}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Run Analysis Now
                </Button>
              )}
            </div>
          </Section>
        )}

        {/* Extracted facts */}
        {localCase.extracted_facts && Object.keys(localCase.extracted_facts).length > 0 && (
          <Section title="Extracted Facts" defaultOpen={false}>
            <div className="space-y-3">
              {localCase.extracted_facts.parties && localCase.extracted_facts.parties.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Parties</p>
                  <ul className="space-y-0.5">
                    {localCase.extracted_facts.parties.map((p, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                        <span className="text-gray-300">·</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {localCase.extracted_facts.timeline && localCase.extracted_facts.timeline.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Timeline</p>
                  <ul className="space-y-0.5">
                    {localCase.extracted_facts.timeline.map((t, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                        <span className="text-gray-300">·</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {localCase.extracted_facts.damages && localCase.extracted_facts.damages.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Damages</p>
                  <ul className="space-y-0.5">
                    {localCase.extracted_facts.damages.map((d, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                        <span className="text-gray-300">·</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {localCase.extracted_facts.jurisdiction && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Jurisdiction</p>
                  <p className="text-xs text-gray-700">{localCase.extracted_facts.jurisdiction}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Client info */}
        <Section title="Client" defaultOpen={false}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Name</span>
              <span className="text-xs font-medium text-gray-800">{localCase.client_name}</span>
            </div>
            {localCase.client_email && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Email</span>
                <a href={`mailto:${localCase.client_email}`} className="text-xs text-violet-600 hover:underline">
                  {localCase.client_email}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Messages</span>
              <span className="text-xs text-gray-700">{localCase.message_count}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
