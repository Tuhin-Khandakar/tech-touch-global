'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastState {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  toasts: ToastState[]
  push: (kind: ToastKind, message: string) => void
  remove: (id: number) => void
}

/**
 * Lightweight local-state toast hook for admin pages.
 *
 * Usage:
 *   const { push, toasts, remove } = useToast()
 *   push('success', 'Inquiry marked resolved')
 *   <ToastStack toasts={toasts} onRemove={remove} />
 *
 * Auto-dismisses after 3.5 s.
 */
export function useToast(): ToastApi {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const remove = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((cur) => [...cur, { id, kind, message }])
    setTimeout(() => remove(id), 3500)
  }, [remove])

  return { toasts, push, remove }
}

const KIND_CLASSES: Record<ToastKind, { bar: string; icon: typeof CheckCircle2; iconColor: string }> = {
  success: { bar: 'bg-accent',     icon: CheckCircle2, iconColor: 'text-accent' },
  error:   { bar: 'bg-gold',       icon: XCircle,      iconColor: 'text-gold'   },
  info:    { bar: 'bg-secondary',  icon: Info,         iconColor: 'text-secondary' },
}

interface ToastStackProps {
  toasts: ToastState[]
  onRemove: (id: number) => void
}

export default function ToastStack({ toasts, onRemove }: ToastStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-[360px]" aria-live="polite">
      {toasts.map((t) => {
        const { bar, icon: Icon, iconColor } = KIND_CLASSES[t.kind]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 pl-1 pr-3 py-3 rounded-xl bg-[#1A2236] border border-[rgba(255,255,255,0.12)]',
              'shadow-[0_8px_24px_rgba(0,0,0,0.40)] animate-[slide-in_180ms_ease-out_both]'
            )}
          >
            <span className={cn('w-1 self-stretch rounded-full shrink-0', bar)} />
            <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', iconColor)} />
            <p className="flex-1 text-sm text-white leading-snug">{t.message}</p>
            <button
              onClick={() => onRemove(t.id)}
              className="shrink-0 -mr-1 p-1 rounded text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
