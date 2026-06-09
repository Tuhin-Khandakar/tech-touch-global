'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Trash2, Mail, Phone, Calendar, Tag, MessageSquare, X, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import type { Inquiry } from '@/types'
import { cn } from '@/lib/utils'

// ── Constants ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['new', 'in_progress', 'resolved', 'closed'] as const
type Status = typeof STATUS_OPTIONS[number]

const statusChip: Record<Status, string> = {
  new:         'bg-secondary/15 text-secondary border border-secondary/30',
  in_progress: 'bg-gold/15 text-gold border border-gold/30',
  resolved:    'bg-accent/15 text-accent border border-accent/30',
  closed:      'bg-white/8 text-[rgba(255,255,255,0.65)] border border-white/10',
}

// ── Helpers ─────────────────────────────────────────────────────────────
function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Component ───────────────────────────────────────────────────────────
export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [allCounts, setAllCounts] = useState<Record<Status | 'all', number>>({ all: 0, new: 0, in_progress: 0, resolved: 0, closed: 0 })
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<Inquiry | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const debouncedSearch = useDebounced(search, 200)
  const { toasts, push, remove } = useToast()

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}&limit=100` : '?limit=100'
      const res = await fetch(`/api/inquiries${params}`)
      const data = await res.json()
      if (data.success) {
        setInquiries(data.data as Inquiry[])
      } else {
        push('error', data.error ?? 'Failed to load inquiries')
      }
    } catch {
      push('error', 'Network error loading inquiries')
    }
    setLoading(false)
  }, [filterStatus, push])

  const fetchCounts = useCallback(async () => {
    try {
      // Fetch counts per status in one call (we just GET everything for counts; cheaper alt: server endpoint)
      const res = await fetch('/api/inquiries?limit=1000')
      const data = await res.json()
      if (!data.success) return
      const list = data.data as Inquiry[]
      const counts: Record<Status | 'all', number> = { all: list.length, new: 0, in_progress: 0, resolved: 0, closed: 0 }
      for (const inq of list) {
        if ((STATUS_OPTIONS as readonly string[]).includes(inq.status)) counts[inq.status as Status]++
      }
      setAllCounts(counts)
    } catch { /* silent — counts are cosmetic */ }
  }, [])

  useEffect(() => { fetchInquiries() }, [fetchInquiries])
  useEffect(() => { fetchCounts()    }, [fetchCounts, inquiries.length])

  // ── Mutations ─────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: Status): Promise<void> {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        push('success', `Marked as ${status.replace('_', ' ')}`)
        // Optimistic local update
        setInquiries((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)))
        if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : null))
      } else {
        push('error', data.error ?? 'Update failed')
      }
    } catch {
      push('error', 'Network error during update')
    }
    setUpdatingId(null)
  }

  async function deleteInquiry(id: string): Promise<void> {
    if (!confirm('Delete this inquiry permanently?')) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/inquiries/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        push('success', 'Inquiry deleted')
        setInquiries((cur) => cur.filter((i) => i.id !== id))
        if (selected?.id === id) setSelected(null)
      } else {
        push('error', data.error ?? 'Delete failed')
      }
    } catch {
      push('error', 'Network error during delete')
    }
    setUpdatingId(null)
  }

  // ── Client-side search filter ─────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return inquiries
    const q = debouncedSearch.toLowerCase().trim()
    return inquiries.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.phone.toLowerCase().includes(q) ||
      i.service.toLowerCase().includes(q) ||
      i.message.toLowerCase().includes(q),
    )
  }, [inquiries, debouncedSearch])

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl">
      {/* Header + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Inquiries</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
            {allCounts.all} total · <span className="text-secondary">{allCounts.new} new</span>
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.45)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, service…"
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
            {s === 'all' ? 'All' : s.replace('_', ' ')}
            <span className={cn(
              'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-md text-[10px] font-bold',
              filterStatus === s ? 'bg-white/20 text-white' : 'bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.65)]'
            )}>
              {allCounts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Two-pane layout (collapses on small screens) */}
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4 lg:gap-6">
        {/* LIST */}
        <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16 text-[rgba(255,255,255,0.55)] text-sm">
              <span className="inline-block w-4 h-4 mr-2 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-[rgba(255,255,255,0.55)] text-sm gap-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              {debouncedSearch
                ? <>No matches for &ldquo;{debouncedSearch}&rdquo;</>
                : <>No inquiries in this category</>}
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(255,255,255,0.06)] overflow-y-auto max-h-[calc(100vh-260px)]">
              {filtered.map((inq) => (
                <li key={inq.id}>
                  <button
                    onClick={() => setSelected(inq)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 hover:bg-[rgba(255,255,255,0.04)] transition-colors flex items-start gap-3',
                      selected?.id === inq.id && 'bg-[rgba(255,255,255,0.06)]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {inq.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-white text-sm truncate">{inq.name}</span>
                        <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider', statusChip[inq.status as Status] ?? statusChip.closed)}>
                          {inq.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.55)] truncate">
                        {inq.service} · {inq.email}
                      </div>
                      <div className="text-[10px] text-[rgba(255,255,255,0.40)] mt-0.5">
                        {formatDate(inq.created_at, 'dd MMM yyyy · HH:mm')}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.30)] mt-0.5 shrink-0 hidden lg:block" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* DETAIL (drawer-style on mobile, side panel on desktop) */}
        {selected ? (
          <>
            {/* Mobile overlay */}
            <div onClick={() => setSelected(null)} className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fade-in_160ms_ease-out_both]" />
            <div
              className={cn(
                'lg:relative lg:bg-[#1A2236] lg:border lg:border-[rgba(255,255,255,0.10)] lg:rounded-2xl lg:overflow-hidden lg:animate-none',
                'fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#1A2236] border-l border-[rgba(255,255,255,0.10)] overflow-y-auto animate-[drawer-in_220ms_ease-out_both]'
              )}
            >
              <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)] sticky top-0 bg-[#1A2236] z-10">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">Inquiry</div>
                  <h2 className="font-display font-bold text-white text-lg tracking-tight truncate">{selected.name}</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 -mr-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-5 space-y-4">
                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a href={`mailto:${selected.email}`} className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] hover:border-secondary/30 transition-colors group">
                    <Mail className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">Email</div>
                      <div className="text-sm text-white break-all leading-tight">{selected.email}</div>
                    </div>
                  </a>
                  <a href={`tel:${selected.phone}`} className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] hover:border-secondary/30 transition-colors group">
                    <Phone className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">Phone</div>
                      <div className="text-sm text-white leading-tight">{selected.phone}</div>
                    </div>
                  </a>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
                    <Tag className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">Service</div>
                      <div className="text-sm text-white leading-tight">{selected.service}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
                    <Calendar className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-0.5">Submitted</div>
                      <div className="text-sm text-white leading-tight">{formatDate(selected.created_at, 'dd MMM yyyy · HH:mm')}</div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-2">Message</div>
                  <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)] mb-2">Update status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        disabled={updatingId === selected.id}
                        onClick={() => updateStatus(selected.id, s)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50',
                          selected.status === s
                            ? 'bg-secondary text-white'
                            : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.82)] hover:bg-[rgba(255,255,255,0.12)]'
                        )}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete */}
                <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    onClick={() => deleteInquiry(selected.id)}
                    disabled={updatingId === selected.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete inquiry
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden lg:flex bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl items-center justify-center p-16 text-[rgba(255,255,255,0.45)] text-sm text-center">
            <div>
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              Select an inquiry from the list to view full details and update its status.
            </div>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}
