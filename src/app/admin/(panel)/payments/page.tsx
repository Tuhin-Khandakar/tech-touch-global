'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, X, CheckCircle2, XCircle, Trash2, Image as ImageIcon, ExternalLink,
  CreditCard, Calendar, Hash, User, Mail, Phone,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import type { PaymentSubmission } from '@/types'

const STATUS_OPTIONS = ['pending', 'confirmed', 'rejected'] as const
type Status = typeof STATUS_OPTIONS[number]

const statusChip: Record<Status, string> = {
  pending:   'bg-gold/15 text-gold border border-gold/30',
  confirmed: 'bg-accent/15 text-accent border border-accent/30',
  rejected:  'bg-white/8 text-[rgba(255,255,255,0.65)] border border-white/10',
}

const methodLabel: Record<string, { label: string; color: string }> = {
  bkash: { label: 'bKash', color: 'text-secondary' },
  nagad: { label: 'Nagad', color: 'text-gold'      },
  bank:  { label: 'Bank',  color: 'text-accent'    },
}

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function PaymentsPageInner() {
  const params = useSearchParams()
  const initialStatus = (params.get('status') as Status | null) ?? 'all'

  const [payments, setPayments] = useState<PaymentSubmission[]>([])
  const [counts, setCounts]     = useState<Record<'all' | Status, number>>({ all: 0, pending: 0, confirmed: 0, rejected: 0 })
  const [loading, setLoading]   = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | Status>(initialStatus as 'all' | Status)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<PaymentSubmission | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [screenshotOpen, setScreenshotOpen] = useState(false)
  const debouncedSearch = useDebounced(search, 200)
  const { toasts, push, remove } = useToast()

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const qs = filterStatus !== 'all' ? `?status=${filterStatus}&limit=200` : '?limit=200'
      const res = await fetch(`/api/payments${qs}`)
      const data = await res.json()
      if (data.success) setPayments(data.data as PaymentSubmission[])
      else push('error', data.error ?? 'Failed to load payments')
    } catch {
      push('error', 'Network error loading payments')
    }
    setLoading(false)
  }, [filterStatus, push])

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/payments?limit=1000')
      const data = await res.json()
      if (!data.success) return
      const list = data.data as PaymentSubmission[]
      const c: Record<'all' | Status, number> = { all: list.length, pending: 0, confirmed: 0, rejected: 0 }
      for (const p of list) {
        if ((STATUS_OPTIONS as readonly string[]).includes(p.status)) c[p.status as Status]++
      }
      setCounts(c)
    } catch { /* cosmetic */ }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { fetchCounts() }, [fetchCounts, payments.length])

  // ── Mutations ─────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: Status): Promise<void> {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        const verb = status === 'confirmed' ? 'Confirmed' : status === 'rejected' ? 'Rejected' : 'Updated'
        push('success', `${verb} payment`)
        setPayments((cur) => cur.map((p) => (p.id === id ? { ...p, status } : p)))
        if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null)
      } else {
        push('error', data.error ?? 'Update failed')
      }
    } catch {
      push('error', 'Network error during update')
    }
    setUpdatingId(null)
  }

  async function deletePayment(id: string): Promise<void> {
    if (!confirm('Delete this payment record permanently?')) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        push('success', 'Payment deleted')
        setPayments((cur) => cur.filter((p) => p.id !== id))
        if (selected?.id === id) setSelected(null)
      } else {
        push('error', data.error ?? 'Delete failed')
      }
    } catch {
      push('error', 'Network error during delete')
    }
    setUpdatingId(null)
  }

  // ── Client-side filter ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return payments
    const q = debouncedSearch.toLowerCase().trim()
    return payments.filter((p) =>
      p.transaction_id.toLowerCase().includes(q) ||
      p.sender_number.toLowerCase().includes(q) ||
      p.service.toLowerCase().includes(q) ||
      p.amount.toLowerCase().includes(q) ||
      (p.payer_name ?? '').toLowerCase().includes(q) ||
      (p.payer_email ?? '').toLowerCase().includes(q),
    )
  }, [payments, debouncedSearch])

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Payments</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
            {counts.all} total · <span className="text-gold">{counts.pending} pending review</span>
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.45)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search TX, number, payer…"
            className="w-full h-10 pl-10 pr-3 bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', ...STATUS_OPTIONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2',
              filterStatus === s
                ? 'bg-secondary text-white'
                : 'bg-[#1A2236] text-[rgba(255,255,255,0.65)] hover:bg-[#262E44] hover:text-white border border-[rgba(255,255,255,0.06)]'
            )}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={cn(
              'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-md text-[10px] font-bold',
              filterStatus === s ? 'bg-white/20 text-white' : 'bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.65)]'
            )}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Table (desktop) / cards (mobile) */}
      <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-16 text-center text-[rgba(255,255,255,0.55)] text-sm">
            <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-[rgba(255,255,255,0.55)] text-sm">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {debouncedSearch ? <>No matches for &ldquo;{debouncedSearch}&rdquo;</> : <>No payments yet</>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                    {['Date', 'Service', 'Method', 'Amount', 'TX ID', 'Sender', 'Status', ''].map((h, i) => (
                      <th key={h + i} className="px-4 py-3 text-left text-[10px] font-semibold text-[rgba(255,255,255,0.55)] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {filtered.map((p) => {
                    const m = methodLabel[p.payment_method] ?? { label: p.payment_method, color: 'text-white' }
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-[rgba(255,255,255,0.65)] text-xs whitespace-nowrap">
                          {formatDate(p.created_at, 'dd MMM, HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap max-w-[180px] truncate">{p.service}</td>
                        <td className={`px-4 py-3 font-bold whitespace-nowrap text-xs uppercase tracking-wider ${m.color}`}>{m.label}</td>
                        <td className="px-4 py-3 text-accent font-semibold whitespace-nowrap">{p.amount}</td>
                        <td className="px-4 py-3 text-[rgba(255,255,255,0.82)] font-mono text-xs whitespace-nowrap max-w-[140px] truncate">{p.transaction_id}</td>
                        <td className="px-4 py-3 text-[rgba(255,255,255,0.65)] text-xs whitespace-nowrap font-mono">{p.sender_number}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', statusChip[p.status as Status] ?? statusChip.rejected)}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {p.screenshot_url
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary"><ImageIcon className="w-3 h-3" /> receipt</span>
                            : <span className="text-[10px] text-[rgba(255,255,255,0.30)]">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[rgba(255,255,255,0.06)]">
              {filtered.map((p) => {
                const m = methodLabel[p.payment_method] ?? { label: p.payment_method, color: 'text-white' }
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="w-full text-left px-4 py-3.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{p.amount}</span>
                        <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider', statusChip[p.status as Status] ?? statusChip.rejected)}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.65)] truncate font-mono">
                        <span className={`font-bold ${m.color}`}>{m.label}</span> · {p.transaction_id}
                      </div>
                      <div className="text-[10px] text-[rgba(255,255,255,0.40)] mt-0.5">
                        {p.service} · {formatDate(p.created_at, 'dd MMM, HH:mm')}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fade-in_160ms_ease-out_both]" />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#1A2236] border-l border-[rgba(255,255,255,0.10)] overflow-y-auto animate-[drawer-in_220ms_ease-out_both]">
            <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)] sticky top-0 bg-[#1A2236] z-10">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">Payment</div>
                <h2 className="font-display font-bold text-white text-lg tracking-tight">{selected.amount}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 -mr-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-5 space-y-4">
              {/* Status chip */}
              <div className="flex items-center gap-2">
                <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', statusChip[selected.status as Status] ?? statusChip.rejected)}>
                  {selected.status}
                </span>
                <span className="text-[10px] text-[rgba(255,255,255,0.55)] uppercase tracking-wider">
                  {formatDate(selected.created_at, 'dd MMM yyyy · HH:mm')}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailCell icon={CreditCard}  label="Method"  value={(methodLabel[selected.payment_method] ?? { label: selected.payment_method }).label} colorClass={methodLabel[selected.payment_method]?.color ?? 'text-white'} />
                <DetailCell icon={Hash}        label="TX ID"   value={selected.transaction_id}  mono />
                <DetailCell icon={Phone}       label="Sender #"value={selected.sender_number}    mono />
                <DetailCell icon={Calendar}    label="Service" value={selected.service} />
                {selected.payer_name && (
                  <DetailCell icon={User}     label="Payer"   value={selected.payer_name} />
                )}
                {selected.payer_email && (
                  <DetailCell icon={Mail}     label="Email"   value={selected.payer_email} mono />
                )}
              </div>

              {/* Note */}
              {selected.note && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-2">Note</div>
                  <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-sm text-white leading-relaxed">
                    {selected.note}
                  </div>
                </div>
              )}

              {/* Screenshot */}
              {selected.screenshot_url ? (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-2">Receipt screenshot</div>
                  <button
                    onClick={() => setScreenshotOpen(true)}
                    className="block w-full rounded-xl overflow-hidden border border-[rgba(255,255,255,0.10)] hover:border-secondary/50 transition-colors group"
                  >
                    {/* Plain <img> — the screenshot is at an arbitrary Supabase Storage URL, not bundled */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.screenshot_url}
                      alt="Payment receipt"
                      className="w-full max-h-72 object-contain bg-[rgba(0,0,0,0.30)]"
                      loading="lazy"
                    />
                    <div className="px-3 py-2 bg-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs">
                      <span className="text-[rgba(255,255,255,0.65)]">Click to enlarge</span>
                      <ExternalLink className="w-3.5 h-3.5 text-secondary" />
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-[rgba(255,255,255,0.10)] text-center text-xs text-[rgba(255,255,255,0.45)]">
                  No receipt screenshot was uploaded
                </div>
              )}

              {/* Actions */}
              {selected.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    disabled={updatingId === selected.id}
                    onClick={() => updateStatus(selected.id, 'confirmed')}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-accent/15 text-accent border border-accent/30 font-semibold text-sm hover:bg-accent/25 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm
                  </button>
                  <button
                    disabled={updatingId === selected.id}
                    onClick={() => updateStatus(selected.id, 'rejected')}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gold/15 text-gold border border-gold/30 font-semibold text-sm hover:bg-gold/25 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {/* Reopen */}
              {selected.status !== 'pending' && (
                <button
                  onClick={() => updateStatus(selected.id, 'pending')}
                  disabled={updatingId === selected.id}
                  className="w-full h-11 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.82)] hover:bg-[rgba(255,255,255,0.06)] text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Reopen as pending
                </button>
              )}

              {/* Delete */}
              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  onClick={() => deletePayment(selected.id)}
                  disabled={updatingId === selected.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete record
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lightbox for screenshot */}
      {screenshotOpen && selected?.screenshot_url && (
        <div
          onClick={() => setScreenshotOpen(false)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-[fade-in_160ms_ease-out_both]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.screenshot_url}
            alt="Payment receipt enlarged"
            className="max-h-[92vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setScreenshotOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close enlarged view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────
interface DetailCellProps {
  icon:   React.ComponentType<{ className?: string }>
  label:  string
  value:  string
  mono?:  boolean
  colorClass?: string
}
function DetailCell({ icon: Icon, label, value, mono, colorClass = 'text-white' }: DetailCellProps) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
      <Icon className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">{label}</div>
        <div className={cn('text-sm leading-tight break-all', colorClass, mono && 'font-mono text-xs')}>{value}</div>
      </div>
    </div>
  )
}

// ── Suspense wrapper (required for useSearchParams in Next 16) ────────────
export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<div className="text-[rgba(255,255,255,0.55)] text-sm">Loading…</div>}>
      <PaymentsPageInner />
    </Suspense>
  )
}
