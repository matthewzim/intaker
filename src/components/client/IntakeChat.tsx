'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import type { Message, Case } from '@/lib/types'

interface IntakeChatProps {
  caseData: Case
}

// Render simple markdown-like formatting for AI messages
function MessageContent({ content, role }: { content: string; role: string }) {
  if (role !== 'ai') {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
  }

  // Simple markdown: bold, bullet points
  const lines = content.split('\n')
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
              <span>{line.slice(2)}</span>
            </div>
          )
        }
        return line ? <p key={i}>{line}</p> : <br key={i} />
      })}
    </div>
  )
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-violet-600" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5">
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Analysis progress notification
function AnalysisNotice() {
  return (
    <div className="flex justify-center py-2 animate-fade-in">
      <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 text-xs text-violet-700 font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        Analyzing your case...
      </div>
    </div>
  )
}

export function IntakeChat({ caseData }: IntakeChatProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(caseData.intake_complete)
  const [messageCount, setMessageCount] = useState(caseData.message_count)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages()
  }, [caseData.id])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/messages/${caseData.id}`)
      const json = await res.json()
      if (json.data) {
        setMessages(json.data)
        // If no messages yet, trigger an opening greeting
        if (json.data.length === 0) {
          await triggerOpeningMessage()
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  async function triggerOpeningMessage() {
    try {
      // Save initial AI greeting
      const greeting = `Hi ${caseData.client_name}! I'm your legal intake assistant. I'm here to help gather information about your situation so our attorneys can review your case.

To get started: **tell me what happened**. Don't worry about legal terms — just describe the situation in your own words.`

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseData.id,
          role: 'ai',
          content: greeting,
        }),
      })
      const json = await res.json()
      if (json.data) {
        setMessages([json.data])
      }
    } catch (error) {
      console.error('Failed to send opening message:', error)
    }
  }

  async function sendMessage() {
    const content = input.trim()
    if (!content || isLoading) return

    setInput('')
    setIsLoading(true)

    // Optimistic UI: add client message immediately
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      case_id: caseData.id,
      role: 'client',
      content,
      message_type: 'chat',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseData.id, content }),
      })
      const json = await res.json()

      if (json.data) {
        setMessageCount(json.data.messageCount)

        // Show analysis indicator if it was triggered
        if (json.data.analysisTriggered) {
          setIsAnalyzing(true)
          setTimeout(() => {
            setIsAnalyzing(false)
            setAnalysisComplete(true)
          }, 2000)
        }

        // Replace optimistic message and add AI reply
        const freshMessages = await fetch(`/api/messages/${caseData.id}`).then(r => r.json())
        if (freshMessages.data) {
          setMessages(freshMessages.data)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Progress bar: 5 client messages = analysis triggered
  const clientMessages = messages.filter(m => m.role === 'client').length
  const progressPct = Math.min((clientMessages / 5) * 100, 100)

  return (
    <div className="flex flex-col h-full">

      {/* Progress indicator */}
      {!analysisComplete && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Intake progress</span>
            <span className="text-xs text-gray-400">
              {clientMessages < 5
                ? `${5 - clientMessages} more question${5 - clientMessages !== 1 ? 's' : ''} for initial review`
                : 'Analyzing your case...'}
            </span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Analysis complete banner */}
      {analysisComplete && (
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">
            Your case has been analyzed and sent to our legal team for review. You&apos;ll hear back soon.
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scroll px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'flex gap-3 animate-slide-up',
              message.role === 'client' && 'flex-row-reverse'
            )}
          >
            {/* Avatar */}
            {message.role !== 'client' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                {message.role === 'ai' ? (
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 text-xs font-semibold">
                    L
                  </div>
                )}
              </div>
            )}

            {/* Bubble */}
            <div className={clsx('max-w-[80%] space-y-1', message.role === 'client' && 'items-end flex flex-col')}>
              <div
                className={clsx(
                  'px-4 py-3 rounded-2xl',
                  message.role === 'client'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : message.role === 'ai'
                    ? 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-card'
                    : 'bg-sky-50 border border-sky-200 text-gray-900 rounded-tl-sm'
                )}
              >
                {message.role === 'lawyer' && (
                  <p className="text-xs font-semibold text-sky-600 mb-1">Attorney</p>
                )}
                <MessageContent content={message.content} role={message.role} />
              </div>
              <span className="text-xs text-gray-400 px-1">
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}
        {isAnalyzing && <AnalysisNotice />}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what happened..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all max-h-40 custom-scroll"
              style={{ minHeight: '46px' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
              input.trim() && !isLoading
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
