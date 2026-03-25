'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Bot, User, Briefcase } from 'lucide-react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import type { Message, Case } from '@/lib/types'

interface ChatPaneProps {
  caseData: Case
  role: 'client' | 'lawyer'
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-card">
        <div className="flex items-center gap-1">
          <div className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <div className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <div className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isClient = message.role === 'client'
  const isLawyer = message.role === 'lawyer'
  const isAI = message.role === 'ai'

  const avatar = (
    <div className={clsx(
      'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
      isClient ? 'bg-violet-100' : isLawyer ? 'bg-sky-100' : 'bg-gray-100'
    )}>
      {isClient && <User className="w-3.5 h-3.5 text-violet-600" />}
      {isLawyer && <Briefcase className="w-3.5 h-3.5 text-sky-600" />}
      {isAI && <Sparkles className="w-3.5 h-3.5 text-gray-500" />}
    </div>
  )

  const senderLabel = isClient ? 'Client' : isLawyer ? 'Attorney' : 'AI Assistant'

  return (
    <div className={clsx('flex gap-2 animate-slide-up', isClient && 'flex-row-reverse')}>
      {!isClient && <div className="mt-5 shrink-0">{avatar}</div>}

      <div className={clsx('max-w-[78%] space-y-0.5', isClient && 'items-end flex flex-col')}>
        <span className={clsx('text-xs text-gray-400 px-1', isClient && 'text-right')}>
          {senderLabel} · {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
        <div className={clsx(
          'px-3.5 py-2.5 rounded-2xl text-sm',
          isClient
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : isLawyer
            ? 'bg-sky-50 border border-sky-200 text-gray-900 rounded-tl-sm'
            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-card'
        )}>
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>

      {isClient && <div className="mt-5 shrink-0">{avatar}</div>}
    </div>
  )
}

export function ChatPane({ caseData, role }: ChatPaneProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [caseData.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/messages/${caseData.id}`)
      const json = await res.json()
      if (json.data) setMessages(json.data)
    } catch {
      // Silently fail on polling errors
    }
  }

  async function sendMessage() {
    const content = input.trim()
    if (!content || isLoading) return

    setInput('')
    setSuggestion('')
    setIsLoading(true)

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      case_id: caseData.id,
      role,
      content,
      message_type: 'chat',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseData.id, role, content }),
      })
      await fetchMessages()
    } catch (error) {
      console.error('Failed to send:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  async function getSuggestion() {
    setLoadingSuggestion(true)
    try {
      const res = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseData.id }),
      })
      const json = await res.json()
      if (json.data?.suggestion) {
        setSuggestion(json.data.suggestion)
        setInput(json.data.suggestion)
        inputRef.current?.focus()
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingSuggestion(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Case Thread</h3>
          <p className="text-xs text-gray-500">{messages.length} messages · auto-refreshing</p>
        </div>
        {role === 'lawyer' && (
          <button
            onClick={getSuggestion}
            disabled={loadingSuggestion}
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loadingSuggestion ? 'Generating...' : 'AI Suggest Reply'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scroll px-4 py-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        {suggestion && (
          <div className="mb-2 p-2 bg-violet-50 rounded-lg border border-violet-200 text-xs text-violet-700">
            <span className="font-medium">AI suggestion applied.</span> Edit as needed before sending.
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={role === 'lawyer' ? 'Message the client...' : 'Message your attorney...'}
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all max-h-32 custom-scroll"
              style={{ minHeight: '42px' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all',
              input.trim() && !isLoading
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
