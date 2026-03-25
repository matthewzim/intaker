import { clsx } from 'clsx'
import type { CaseStatus, ViabilityScore } from '@/lib/types'

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  reviewing: { label: 'Reviewing', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const config = statusConfig[status]
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}

// ─── Viability Badge ──────────────────────────────────────────────────────────

const viabilityConfig: Record<ViabilityScore, { label: string; className: string; dot: string }> = {
  strong: {
    label: 'Strong',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
  },
  weak: {
    label: 'Weak',
    className: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    dot: 'bg-red-500',
  },
}

export function ViabilityBadge({ score }: { score: ViabilityScore }) {
  const config = viabilityConfig[score]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium', config.className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

// ─── Generic Tag Badge ────────────────────────────────────────────────────────

export function TagBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-gray-200">
      {label}
    </span>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

export function RoleBadge({ role }: { role: 'client' | 'lawyer' | 'ai' }) {
  const configs = {
    client: 'bg-violet-50 text-violet-700',
    lawyer: 'bg-sky-50 text-sky-700',
    ai: 'bg-gray-100 text-gray-600',
  }
  const labels = { client: 'Client', lawyer: 'Lawyer', ai: 'AI Assistant' }
  return (
    <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded', configs[role])}>
      {labels[role]}
    </span>
  )
}
