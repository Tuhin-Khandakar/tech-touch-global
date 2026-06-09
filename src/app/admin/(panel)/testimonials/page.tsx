'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Plus, Trash2, Star } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

interface Testimonial {
  id?:         string
  name:        string
  name_bn:     string
  role:        string
  role_bn:     string
  content:     string
  content_bn:  string
  avatar:      string
  rating:      number
  service:     string
  published:   boolean
}

const SERVICE_OPTIONS = [
  { value: 'general',       label: 'General'        },
  { value: 'tech',          label: 'Tech'           },
  { value: 'study',         label: 'Study Abroad'   },
  { value: 'visa',          label: 'Visa'           },
  { value: 'ielts-pte',     label: 'IELTS / PTE'    },
  { value: 'travel',        label: 'Travel'         },
  { value: 'investment',    label: 'Investment'     },
  { value: 'export-import', label: 'Export/Import'  },
]

function emptyDraft(): Testimonial {
  return {
    name: '', name_bn: '', role: '', role_bn: '',
    content: '', content_bn: '', avatar: '',
    rating: 5, service: 'general', published: true,
  }
}

export default function AdminTestimonialsPage() {
  const [items,    setItems]    = useState<Testimonial[]>([])
  const [loading,  setLoading]  = useState(true)
  const [draft,    setDraft]    = useState<Testimonial>(emptyDraft())
  const [editing,  setEditing]  = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [busyId,   setBusyId]   = useState<string | null>(null)
  const { toasts, push, remove } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      if (data.success) setItems(data.data as Testimonial[])
      else push('error', data.error ?? 'Failed to load')
    } catch { push('error', 'Network error') }
    setLoading(false)
  }, [push])

  useEffect(() => { fetchAll() }, [fetchAll])

  function startEdit(t: Testimonial): void {
    setEditing(t.id ?? null)
    setDraft(t)
  }

  function cancel(): void {
    setEditing(null)
    setDraft(emptyDraft())
  }

  async function save(): Promise<void> {
    if (!draft.name.trim() || !draft.content.trim()) {
      push('error', 'Name and content are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/testimonials', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(draft),
      })
      const data = await res.json()
      if (!data.success) { push('error', data.error ?? 'Save failed'); setSaving(false); return }
      push('success', editing ? 'Testimonial updated' : 'Testimonial added')
      await fetchAll()
      cancel()
    } catch { push('error', 'Network error') }
    setSaving(false)
  }

  async function remove_(id: string): Promise<void> {
    if (!confirm('Delete this testimonial?')) return
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/testimonials', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.success) { await fetchAll(); push('success', 'Deleted') }
      else push('error', data.error ?? 'Delete failed')
    } catch { push('error', 'Network error') }
    setBusyId(null)
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Testimonials</h1>
        <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
          Client quotes that rotate on the home page and across the site.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* List */}
        <section className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <header className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <h2 className="font-display font-bold text-white text-sm">All testimonials ({items.length})</h2>
          </header>
          {loading ? (
            <div className="p-10 flex items-center justify-center text-[rgba(255,255,255,0.55)] text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-[rgba(255,255,255,0.55)]">
              No testimonials yet. Add your first one →
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
              {items.map((t) => (
                <li key={t.id} className={cn(
                  'px-5 py-4 hover:bg-[rgba(255,255,255,0.04)] transition-colors',
                  editing === t.id && 'bg-secondary/5',
                )}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F172A] border border-[rgba(255,255,255,0.10)] overflow-hidden shrink-0 flex items-center justify-center text-sm font-semibold text-secondary">
                      {t.avatar
                        ? <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                        : t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-white text-sm">{t.name}</span>
                        <RatingStars value={t.rating} />
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                          t.published ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-white/8 text-[rgba(255,255,255,0.65)] border border-white/10',
                        )}>
                          {t.published ? 'Live' : 'Draft'}
                        </span>
                        <span className="text-[10px] text-[rgba(255,255,255,0.45)] uppercase tracking-wider">{t.service}</span>
                      </div>
                      {t.role && <p className="text-xs text-[rgba(255,255,255,0.55)] mb-1">{t.role}</p>}
                      <p className="text-xs text-[rgba(255,255,255,0.75)] line-clamp-2">{t.content}</p>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => startEdit(t)} className="text-[11px] text-secondary hover:text-accent font-semibold">
                          Edit
                        </button>
                        <button
                          onClick={() => t.id && remove_(t.id)}
                          disabled={busyId === t.id}
                          className="text-[11px] text-[rgba(255,255,255,0.65)] hover:text-gold flex items-center gap-1 disabled:opacity-50"
                        >
                          {busyId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Editor */}
        <aside className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden self-start sticky top-6">
          <header className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <h2 className="font-display font-bold text-white text-sm">
              {editing ? 'Edit testimonial' : 'Add testimonial'}
            </h2>
            {editing && (
              <button onClick={cancel} className="text-[11px] text-[rgba(255,255,255,0.55)] hover:text-white">
                + New
              </button>
            )}
          </header>
          <div className="p-5 space-y-4">
            <Field label="Avatar">
              <ImageUploader
                value={draft.avatar}
                onChange={(url) => setDraft({ ...draft, avatar: url })}
                folder="testimonials"
                aspect="square"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name EN"><Input value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} /></Field>
              <Field label="Name BN"><Input value={draft.name_bn} onChange={(v) => setDraft({ ...draft, name_bn: v })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role EN"><Input value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} placeholder="CEO, Acme Ltd" /></Field>
              <Field label="Role BN"><Input value={draft.role_bn} onChange={(v) => setDraft({ ...draft, role_bn: v })} /></Field>
            </div>
            <Field label="Quote EN"><Textarea value={draft.content} onChange={(v) => setDraft({ ...draft, content: v })} rows={4} /></Field>
            <Field label="Quote BN"><Textarea value={draft.content_bn} onChange={(v) => setDraft({ ...draft, content_bn: v })} rows={4} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Service category">
                <select
                  value={draft.service}
                  onChange={(e) => setDraft({ ...draft, service: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Rating">
                <select
                  value={draft.rating}
                  onChange={(e) => setDraft({ ...draft, rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
                >
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs text-white px-3 py-2 rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.10)] cursor-pointer">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                className="accent-secondary"
              />
              Published (visible on site)
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="w-full h-11 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add testimonial'}
            </button>
          </div>
        </aside>
      </div>

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('w-3 h-3', n <= value ? 'fill-gold text-gold' : 'text-[rgba(255,255,255,0.20)]')}
        />
      ))}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
    />
  )
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
    />
  )
}
