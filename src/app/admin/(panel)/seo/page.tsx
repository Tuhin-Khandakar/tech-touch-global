'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Plus, Trash2, EyeOff } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

interface PageSeo {
  route:          string
  title_en:       string
  title_bn:       string
  description_en: string
  description_bn: string
  og_image:       string
  noindex:        boolean
}

function empty(): PageSeo {
  return { route: '', title_en: '', title_bn: '', description_en: '', description_bn: '', og_image: '', noindex: false }
}

export default function AdminSeoPage() {
  const [rows,     setRows]     = useState<PageSeo[]>([])
  const [loading,  setLoading]  = useState(true)
  const [draft,    setDraft]    = useState<PageSeo>(empty())
  const [editing,  setEditing]  = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [busy,     setBusy]     = useState<string | null>(null)
  const { toasts, push, remove } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/page-seo')
      const data = await res.json()
      if (data.success) setRows(data.data as PageSeo[])
      else push('error', data.error ?? 'Failed to load')
    } catch { push('error', 'Network error') }
    setLoading(false)
  }, [push])

  useEffect(() => { fetchAll() }, [fetchAll])

  function startEdit(r: PageSeo): void {
    setEditing(r.route)
    setDraft(r)
  }

  function cancel(): void {
    setEditing(null)
    setDraft(empty())
  }

  async function save(): Promise<void> {
    if (!draft.route.trim()) { push('error', 'Route is required (e.g. /about)'); return }
    if (!draft.route.startsWith('/')) { push('error', 'Route must start with /'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/page-seo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(draft),
      })
      const data = await res.json()
      if (!data.success) { push('error', data.error ?? 'Save failed'); setSaving(false); return }
      push('success', editing ? 'SEO updated' : 'SEO added')
      await fetchAll()
      cancel()
    } catch { push('error', 'Network error') }
    setSaving(false)
  }

  async function remove_(route: string): Promise<void> {
    if (!confirm(`Reset SEO for ${route}?`)) return
    setBusy(route)
    try {
      const res = await fetch('/api/admin/page-seo', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ route }),
      })
      const data = await res.json()
      if (data.success) { await fetchAll(); push('success', 'Deleted') }
      else push('error', data.error ?? 'Delete failed')
    } catch { push('error', 'Network error') }
    setBusy(null)
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Page SEO</h1>
        <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
          Per-route meta title, description, OG image, and indexing controls. Empty rows fall back to the global defaults in Settings.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_460px] gap-6">
        {/* List */}
        <section className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <header className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="font-display font-bold text-white text-sm">Configured routes ({rows.length})</h2>
          </header>
          {loading ? (
            <div className="p-10 flex items-center justify-center text-[rgba(255,255,255,0.55)] text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-[rgba(255,255,255,0.55)]">
              No per-page SEO yet. Add your first one →
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
              {rows.map((r) => (
                <li
                  key={r.route}
                  className={cn(
                    'px-5 py-4 hover:bg-[rgba(255,255,255,0.04)] transition-colors',
                    editing === r.route && 'bg-secondary/5',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-secondary">{r.route}</span>
                    {r.noindex && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30">
                        <EyeOff className="w-2.5 h-2.5" /> Noindex
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white truncate">{r.title_en || '(no title)'}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.55)] truncate mt-0.5">{r.description_en || '(no description)'}</p>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => startEdit(r)} className="text-[11px] text-secondary hover:text-accent font-semibold">
                      Edit
                    </button>
                    <button
                      onClick={() => remove_(r.route)}
                      disabled={busy === r.route}
                      className="text-[11px] text-[rgba(255,255,255,0.65)] hover:text-gold flex items-center gap-1 disabled:opacity-50"
                    >
                      {busy === r.route ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
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
              {editing ? `Edit ${editing}` : 'Add page SEO'}
            </h2>
            {editing && (
              <button onClick={cancel} className="text-[11px] text-[rgba(255,255,255,0.55)] hover:text-white">
                + New
              </button>
            )}
          </header>
          <div className="p-5 space-y-4">
            <Field label="Route" hint="e.g. /about, /services/visa">
              <Input
                value={draft.route}
                onChange={(v) => setDraft({ ...draft, route: v })}
                placeholder="/about"
                disabled={!!editing}
              />
            </Field>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Title EN"><Input value={draft.title_en} onChange={(v) => setDraft({ ...draft, title_en: v })} /></Field>
              <Field label="Title BN"><Input value={draft.title_bn} onChange={(v) => setDraft({ ...draft, title_bn: v })} /></Field>
              <Field label="Description EN"><Textarea value={draft.description_en} onChange={(v) => setDraft({ ...draft, description_en: v })} rows={2} /></Field>
              <Field label="Description BN"><Textarea value={draft.description_bn} onChange={(v) => setDraft({ ...draft, description_bn: v })} rows={2} /></Field>
            </div>
            <Field label="Open Graph image" hint="Shown when this page is shared on social media.">
              <ImageUploader
                value={draft.og_image}
                onChange={(url) => setDraft({ ...draft, og_image: url })}
                folder="settings"
                aspect="16/9"
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-white px-3 py-2 rounded-lg bg-[#0F172A] border border-[rgba(255,255,255,0.10)] cursor-pointer">
              <input
                type="checkbox"
                checked={draft.noindex}
                onChange={(e) => setDraft({ ...draft, noindex: e.target.checked })}
                className="accent-secondary"
              />
              Hide from search engines (noindex)
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="w-full h-11 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add SEO override'}
            </button>
          </div>
        </aside>
      </div>

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[rgba(255,255,255,0.45)]">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary disabled:opacity-60 disabled:cursor-not-allowed"
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
