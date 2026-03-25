'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Scale, LayoutDashboard, MessageSquare, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

type Role = 'client' | 'lawyer'

interface HeaderProps {
  currentRole?: Role
  caseId?: string
  caseName?: string
}

export function Header({ currentRole = 'client', caseId, caseName }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isLawyer = currentRole === 'lawyer'

  function toggleRole() {
    if (isLawyer) {
      router.push('/client')
    } else {
      router.push('/lawyer')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Caseflow</span>
        </Link>

        {/* Breadcrumb (when in a case workspace) */}
        {caseId && caseName && (
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
            <Link
              href={isLawyer ? '/lawyer' : '/client'}
              className="hover:text-gray-700 shrink-0"
            >
              {isLawyer ? 'Dashboard' : 'My Cases'}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate">{caseName}</span>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">

          {/* View mode indicator */}
          <span className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-md',
            isLawyer ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'
          )}>
            {isLawyer ? 'Lawyer View' : 'Client View'}
          </span>

          {/* Role toggle */}
          <button
            onClick={toggleRole}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm text-gray-600 font-medium"
            title="Switch view"
          >
            {isLawyer ? (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Client View</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Lawyer View</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>
    </header>
  )
}
