'use client'

import { AgentChat, createAgentChat } from '@21st-sdk/nextjs'
import { useChat } from '@ai-sdk/react'
import theme from '@/app/theme.json'

/**
 * Public AI concierge page — powered by the 21st-sdk agent runtime.
 *
 * Separate from /admin/chat (human-staffed Supabase realtime). The AI
 * here is for instant after-hours Q&A: which service fits, IELTS tips,
 * inquiry flow, etc.
 *
 *   /en/ask-ai   /bn/ask-ai
 */
const chat = createAgentChat({
  agent:    'my-agent',
  tokenUrl: '/api/an-token',
})

export default function AskAiPage() {
  // @ai-sdk/react v3: useChat returns { messages, sendMessage, status, stop, error, ... }
  const { messages, sendMessage, status, stop, error } = useChat({ chat })

  return (
    <div className="pt-[68px] min-h-[calc(100vh-68px)] flex flex-col bg-white">
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-6">
        <header className="mb-4 shrink-0">
          <h1 className="text-2xl font-display font-extrabold text-primary tracking-[-0.03em]">
            AI Concierge
          </h1>
          <p className="text-sm text-muted mt-1">
            Get instant answers about our services, study-abroad destinations, IELTS prep, and the inquiry flow.
            For pricing or eligibility, a human consultant will follow up.
          </p>
        </header>
        <div className="flex-1 min-h-[480px]">
          <AgentChat
            messages={messages}
            onSend={(message) => sendMessage({
              role:  message.role,
              parts: [{ type: 'text', text: message.content }],
            })}
            status={status}
            onStop={stop}
            error={error ?? undefined}
            theme={theme}
          />
        </div>
      </div>
    </div>
  )
}
