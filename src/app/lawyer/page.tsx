'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Database
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { CaseCard } from '@/components/lawyer/CaseCard'
import { Button } from '@/components/ui/Button'
import type { Case, CaseStatus, ViabilityScore } from '@/lib/types'

type FilterStatus = 'all' | CaseStatus
type FilterViability = 'all' | ViabilityScore

export default function LawyerDashboard() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterViability, setFilterViability] = useState<FilterViability>('all')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchCases()
  }, [])

  async function fetchCases() {
    setLoading(true)
    try {
      const res = await fetch('/api/cases')
      const json = await res.json()
      if (json.data) {
        setCases(json.data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error)
    } finally {
      setLoading(false)
    }
  }

  async function seedDemo() {
    if (!confirm('This will clear all existing cases and create demo data. Continue?')) return
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const json = await res.json()
      if (json.data) {
        await fetchCases()
        alert('Demo data loaded! You now have 4 sample cases.')
      } else {
        alert(`Seed failed: ${json.error}`)
      }
    } catch (error) {
      alert('Seed failed. Check console.')
      console.error(error)
    } finally {
      setSeeding(false)
    }
  }

  // Filter and search
  const filtered = cases.filter(c => {
    const matchSearch =
      !search ||
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.legal_category?.toLowerCase().includes(search.toLowerCase()) ||
      c.summary?.toLowerCase().includes(search.toLowerCase())

    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchViability = filterViability === 'all' || c.viability_score === filterViability

    return matchSearch && matchStatus && matchViability
  })

  // Stats
  const stats = {
    total: cases.length,
    new: cases.filter(c => c.status === 'new').length,
    reviewing: cases.filter(c => c.status === 'reviewing').length,
    accepted: cases.filter(c => c.status === 'accepted').length,
    strong: cases.filter(c => c.viability_score === 'strong').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentRole="lawyer" />

      <div className="max-w-screen-lg mx-auto px-4 py-6">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-5 h-5 text-gray-700" />
              <h1 className="text-xl font-semibold text-gray-900">Intake Dashboard</h1>
            </div>
            <p className="text-sm text-gray-500">
              {cases.length} total cases · refreshed{' '}
              {new Intl.DateTimeFormat('en', { timeStyle: 'short' }).format(lastRefresh)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={seedDemo}
              loading={seeding}
              icon={<Database className="w-3.5 h-3.5" />}
            >
              Load Demo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCases}
              loading={loading}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Cases', value: stats.total, color: 'text-gray-900' },
            { label: 'New', value: stats.new, color: 'text-blue-600' },
            { label: 'Reviewing', value: stats.reviewing, color: 'text-amber-600' },
            { label: 'Accepted', value: stats.accepted, color: 'text-emerald-600' },
            { label: 'Strong Viability', value: stats.strong, color: 'text-violet-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-card text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client name, category, summary..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
            {(['all', 'new', 'reviewing', 'accepted', 'rejected'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterStatus === s
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Viability filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1">
            <Sparkles className="w-3.5 h-3.5 text-gray-400 ml-1" />
            {(['all', 'strong', 'medium', 'weak'] as FilterViability[]).map(v => (
              <button
                key={v}
                onClick={() => setFilterViability(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterViability === v
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Case list */}
        {loading ? (
          <div className="grid gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <LayoutDashboard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {cases.length === 0 ? 'No cases yet' : 'No cases match your filters'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {cases.length === 0
                ? 'Load demo data to see sample cases, or wait for clients to submit intake forms.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {cases.length === 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={seedDemo}
                loading={seeding}
                icon={<Database className="w-3.5 h-3.5" />}
              >
                Load Demo Data
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(c => (
              <CaseCard key={c.id} caseData={c} />
            ))}
            <p className="text-xs text-center text-gray-400 pt-2">
              Showing {filtered.length} of {cases.length} cases
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
