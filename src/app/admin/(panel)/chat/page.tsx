'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ChatSession, ChatMessage } from '@/types'

/**
 * Admin live-chat page.
 *
 * Layout:
 *   - Desktop (≥lg): sessions list on the left, conversation pane on the right.
 *   - Mobile (<lg): single column. Sessions list shown first; opening one
 *     swaps to the conversation view with a Back button.
 *   - Heights are constrained relative to the viewport minus the sticky
 *     admin header (h-14 = 56px) and outer padding.
 */
const VIEWPORT_OFFSET = 'h-[calc(100vh-7rem)]'    // 56px header + 2× p-4 mobile, p-6 desktop padding ≈ 7rem

export default function AdminChatPage() {
  const [sessions, setSessions]         = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetchSessions()
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!activeSession) return
    const supabase = createClient()
    const channel = supabase
      .channel(`admin-chat:${activeSession.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${activeSession.id}` },
        (payload: { new: ChatMessage }) => {
          setMessages((prev) => {
            const msg = payload.new
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeSession])

  async function fetchSessions(): Promise<void> {
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      if (data.success) setSessions(data.data as ChatSession[])
    } catch { /* silent — interval will retry */ }
    setLoadingSessions(false)
  }

  async function selectSession(session: ChatSession): Promise<void> {
    setActiveSession(session)
    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'history', sessionId: session.id }),
      })
      const data = await res.json()
      if (data.success) setMessages(data.data as ChatMessage[])
    } catch { setMessages([]) }
  }

  async function sendMessage(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!input.trim() || !activeSession || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'message', sessionId: activeSession.id, content, sender: 'admin' }),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Live Chat</h1>
        <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
          {sessions.length === 0 ? 'No active chats' : `${sessions.length} active session${sessions.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className={cn('grid gap-4 lg:grid-cols-[320px_1fr]', VIEWPORT_OFFSET, 'min-h-[480px]')}>
        {/* SESSION LIST — hidden on mobile when a session is open */}
        <div className={cn(
          'bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden flex flex-col',
          activeSession && 'hidden lg:flex',
        )}>
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.10)] shrink-0">
            <span className="text-sm font-semibold text-white">Active sessions</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.06)]">
            {loadingSessions ? (
              <div className="p-8 text-center text-[rgba(255,255,255,0.55)] text-sm">
                <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-secondary border-t-transparent animate-spin align-middle" />
                Loading…
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-[rgba(255,255,255,0.55)] text-sm flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 opacity-40" />
                No active chats
              </div>
            ) : sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={cn(
                  'w-full text-left px-4 py-3.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors',
                  activeSession?.id === s.id && 'bg-[rgba(255,255,255,0.06)]',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {s.visitor_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{s.visitor_name}</div>
                    <div className="text-xs text-[rgba(255,255,255,0.55)] truncate">
                      {formatDate(s.updated_at, 'dd MMM, HH:mm')}
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent shrink-0" aria-label="Active" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONVERSATION PANE */}
        <div className={cn(
          'bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden flex flex-col min-w-0',
          !activeSession && 'hidden lg:flex',
        )}>
          {activeSession ? (
            <>
              <div className="px-4 sm:px-5 py-3.5 border-b border-[rgba(255,255,255,0.10)] flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveSession(null)}
                  className="lg:hidden p-1.5 -ml-1.5 rounded-lg text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                  aria-label="Back to sessions"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-xs">
                  {activeSession.visitor_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{activeSession.visitor_name}</div>
                  {activeSession.visitor_email && (
                    <div className="text-xs text-[rgba(255,255,255,0.55)] truncate">{activeSession.visitor_email}</div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center text-[rgba(255,255,255,0.55)] text-sm py-12">
                    No messages yet. Say hello.
                  </div>
                ) : messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.sender === 'admin' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm break-words',
                      msg.sender === 'admin'
                        ? 'bg-secondary text-white rounded-tr-sm'
                        : 'bg-[#262E44] text-[rgba(255,255,255,0.92)] rounded-tl-sm',
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-3 px-3 sm:px-4 py-3 border-t border-[rgba(255,255,255,0.10)] shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 min-w-0 h-10 px-4 bg-primary border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary placeholder-[rgba(255,255,255,0.40)]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 bg-secondary text-white rounded-xl flex items-center justify-center hover:bg-secondary-dark transition-colors disabled:opacity-50 shrink-0"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[rgba(255,255,255,0.55)] text-sm p-8 text-center">
              Select a chat session to start responding
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
