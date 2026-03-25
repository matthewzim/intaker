'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, MessageSquare, LayoutDashboard, ArrowRight, Sparkles, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startIntake(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name to get started.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: name.trim(),
          client_email: email.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push(`/client/case/${json.data.id}`)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Caseflow</span>
          </div>
          <button
            onClick={() => router.push('/lawyer')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Lawyer Portal
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 text-sm text-violet-700 font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Legal Intake
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Get the legal help<br />
            <span className="text-violet-600">you deserve</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Describe your situation, and our AI will help analyze your case and connect you with the right attorney.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Start intake form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Start your intake</h2>
            <p className="text-sm text-gray-500 mb-6">
              Free, confidential, and takes less than 5 minutes.
            </p>

            <form onSubmit={startIntake} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'Creating your case...' : 'Start Free Intake'}
              </Button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your information is kept confidential and secure.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {[
              {
                icon: MessageSquare,
                color: 'bg-violet-100 text-violet-600',
                title: 'Chat-based intake',
                desc: 'Describe your situation naturally. Our AI asks the right follow-up questions to build your case file.',
              },
              {
                icon: Sparkles,
                color: 'bg-amber-100 text-amber-600',
                title: 'Instant AI analysis',
                desc: 'Get immediate classification of your legal issue, case strength assessment, and a structured summary.',
              },
              {
                icon: Shield,
                color: 'bg-emerald-100 text-emerald-600',
                title: 'Lawyer review',
                desc: 'Your case is reviewed by a real attorney who can message you directly and accept or assess your matter.',
              },
              {
                icon: Clock,
                color: 'bg-sky-100 text-sky-600',
                title: 'Shared workspace',
                desc: 'Upload documents, track your case status, and communicate with your legal team in one place.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm mb-0.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lawyer portal CTA */}
        <div className="mt-16 bg-gray-900 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Law firm portal</h3>
            <p className="text-sm text-gray-400">
              Review incoming cases, manage client communication, and streamline your intake process.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push('/lawyer')}
            className="shrink-0"
            icon={<LayoutDashboard className="w-4 h-4" />}
          >
            Open Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
