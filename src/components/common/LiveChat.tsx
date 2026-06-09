'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  sender: 'visitor' | 'admin'
  created_at: string
}

export default function LiveChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [step, setStep] = useState<'form' | 'chat'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
        (payload: { new: Message }) => {
          const msg = payload.new
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  async function startChat(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', name, email }),
      })
      const data = await res.json()
      if (data.success) {
        setSessionId(data.data.sessionId)
        setMessages(data.data.messages ?? [])
        setStep('chat')
      }
    } catch {
      // silently fail — user can retry
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !sessionId || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', sessionId, content, sender: 'visitor' }),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open live chat"
          className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center shadow-2xl shadow-brand hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-24 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-[#EEF0F4] flex flex-col overflow-hidden transition-all duration-200 ${minimized ? 'h-14' : 'h-[420px]'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Live Support</div>
                <div className="text-xs text-[rgba(255,255,255,0.75)]">Typically replies in minutes</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setMinimized(!minimized)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {step === 'form' ? (
                <form onSubmit={startChat} className="flex flex-col gap-3 p-4 flex-1">
                  <p className="text-sm text-[rgba(255,255,255,0.45)]">👋 Hi! Please introduce yourself to start chatting.</p>
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="px-3 py-2 border border-[#E5E7EC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                  />
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 py-2 border border-[#E5E7EC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                  />
                  <button
                    type="submit"
                    className="mt-auto px-4 py-2.5 bg-secondary text-white font-semibold rounded-xl text-sm hover:bg-secondary-dark transition-colors"
                  >
                    Start Chat
                  </button>
                </form>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {messages.length === 0 && (
                      <div className="text-center text-xs text-[rgba(255,255,255,0.65)] py-4">
                        Session started. Our team will reply shortly.
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${msg.sender === 'visitor' ? 'bg-secondary text-white rounded-tr-sm' : 'bg-surface text-primary rounded-tl-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                  {/* Input */}
                  <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-2.5 border-t border-[#EEF0F4]">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 text-xs px-3 py-2 border border-[#E5E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="w-8 h-8 bg-secondary text-white rounded-xl flex items-center justify-center hover:bg-secondary-dark transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
