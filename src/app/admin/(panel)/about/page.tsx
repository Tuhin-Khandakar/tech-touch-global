'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

interface ContentRow { key: string; value_en: string; value_bn: string; kind: string }
interface AboutValue {
  id?:             string
  icon_emoji:      string
  title_en:        string
  title_bn:        string
  description_en:  string
  description_bn:  string
  display_order:   number
  published:       boolean
}

const ABOUT_KEYS: { key: string; label: string; rich?: boolean }[] = [
  { key: 'about.title',              label: 'Hero title' },
  { key: 'about.subtitle',           label: 'Hero subtitle',         rich: true },
  { key: 'about.mission.emoji',      label: 'Mission emoji' },
  { key: 'about.mission.title',      label: 'Mission heading' },
  { key: 'about.mission.body',       label: 'Mission body',          rich: true },
  { key: 'about.vision.emoji',       label: 'Vision emoji' },
  { key: 'about.vision.title',       label: 'Vision heading' },
  { key: 'about.vision.body',        label: 'Vision body',           rich: true },
  { key: 'about.values.eyebrow',     label: 'Values eyebrow' },
  { key: 'about.values.title',       label: 'Values heading' },
  { key: 'about.values.subtitle',    label: 'Values subtitle' },
  { key: 'about.story.eyebrow',      label: 'Story eyebrow' },
  { key: 'about.story.title',        label: 'Story heading' },
  { key: 'about.story.paragraph_1',  label: 'Story paragraph 1',     rich: true },
  { key: 'about.story.paragraph_2',  label: 'Story paragraph 2',     rich: true },
  { key: 'about.story.paragraph_3',  label: 'Story paragraph 3',     rich: true },
]

function emptyValue(order: number): AboutValue {
  return { icon_emoji: '✨', title_en: '', title_bn: '', description_en: '', description_bn: '', display_order: order, published: true }
}

type Tab = 'copy' | 'values'

export default function AdminAboutPage() {
  const [tab,      setTab]      = useState<Tab>('copy')
  const [content,  setContent]  = useState<Record<string, ContentRow>>({})
  const [values,   setValues]   = useState<AboutValue[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [dirty,    setDirty]    = useState<Set<string>>(new Set())
  const [busyId,   setBusyId]   = useState<string | null>(null)
  const { toasts, push, remove } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [contentRes, valuesRes] = await Promise.all([
        fetch('/api/admin/site-content'),
        fetch('/api/admin/about-values'),
      ])
      const contentData = await contentRes.json()
      const valuesData  = await valuesRes.json()
      if (contentData.success) {
        const map: Record<string, ContentRow> = {}
        for (const row of contentData.data as ContentRow[]) {
          if (row.key.startsWith('about.')) map[row.key] = row
        }
        for (const k of ABOUT_KEYS) {
          if (!map[k.key]) map[k.key] = { key: k.key, value_en: '', value_bn: '', kind: k.rich ? 'rich' : 'text' }
        }
        setContent(map)
      }
      if (valuesData.success) setValues(valuesData.data as AboutValue[])
    } catch { push('error', 'Network error') }
    setLoading(false)
  }, [push])

  useEffect(() => { fetchAll() }, [fetchAll])

  function patchContent(key: string, lang: 'en' | 'bn', value: string): void {
    setContent((cur) => ({
      ...cur,
      [key]: { ...(cur[key] ?? { key, value_en: '', value_bn: '', kind: 'text' }), [lang === 'en' ? 'value_en' : 'value_bn']: value },
    }))
    setDirty((d) => new Set(d).add(key))
  }

  async function saveContent(): Promise<void> {
    if (dirty.size === 0) return
    setSaving(true)
    try {
      const entries: Record<string, { en: string; bn: string }> = {}
      for (const key of dirty) {
        entries[key] = {
          en: content[key]?.value_en ?? '',
          bn: content[key]?.value_bn ?? '',
        }
      }
      const res = await fetch('/api/admin/site-content', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entries }),
      })
      const data = await res.json()
      if (!data.success) { push('error', data.error ?? 'Save failed'); setSaving(false); return }
      push('success', `${data.count ?? dirty.size} key${(data.count ?? dirty.size) > 1 ? 's' : ''} saved`)
      setDirty(new Set())
    } catch { push('error', 'Network error') }
    setSaving(false)
  }

  async function saveValue(v: AboutValue): Promise<void> {
    setBusyId(v.id ?? 'new')
    try {
      const res = await fetch('/api/admin/about-values', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(v),
      })
      const data = await res.json()
      if (!data.success) { push('error', data.error ?? 'Save failed'); setBusyId(null); return }
      await fetchAll()
      push('success', 'Value saved')
    } catch { push('error', 'Network error') }
    setBusyId(null)
  }

  async function deleteValue(id: string): Promise<void> {
    if (!confirm('Delete this value?')) return
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/about-values', {
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
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">About page</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
            Edit hero, mission, vision, story, and core values that appear on /about.
          </p>
        </div>
        {tab === 'copy' && (
          <button
            onClick={saveContent}
            disabled={saving || dirty.size === 0}
            className="h-10 px-5 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors disabled:opacity-40 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {dirty.size > 0 ? `(${dirty.size})` : ''}
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-xl p-1">
        {(['copy', 'values'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors',
              tab === t ? 'bg-secondary text-white shadow-brand' : 'text-[rgba(255,255,255,0.65)] hover:text-white',
            )}
          >
            {t === 'copy' ? 'Text content' : `Core values (${values.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingPanel />
      ) : tab === 'copy' ? (
        <section className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 space-y-5">
          {ABOUT_KEYS.map((k) => {
            const row = content[k.key]
            const isDirty = dirty.has(k.key)
            return (
              <div key={k.key} className={cn('p-4 rounded-xl border transition-colors',
                isDirty ? 'border-secondary/40 bg-secondary/5' : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]')}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">{k.label}</h3>
                  <span className="text-[10px] text-[rgba(255,255,255,0.45)] font-mono">{k.key}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {k.rich
                    ? <>
                        <Textarea value={row?.value_en ?? ''} onChange={(v) => patchContent(k.key, 'en', v)} placeholder="English" rows={3} />
                        <Textarea value={row?.value_bn ?? ''} onChange={(v) => patchContent(k.key, 'bn', v)} placeholder="বাংলা" rows={3} />
                      </>
                    : <>
                        <Input value={row?.value_en ?? ''} onChange={(v) => patchContent(k.key, 'en', v)} placeholder="English" />
                        <Input value={row?.value_bn ?? ''} onChange={(v) => patchContent(k.key, 'bn', v)} placeholder="বাংলা" />
                      </>}
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <section className="space-y-3">
          {values.map((v) => (
            <ValueRow key={v.id} value={v} onSave={saveValue} onDelete={deleteValue} busy={busyId === v.id} />
          ))}
          <ValueRow value={emptyValue(values.length)} onSave={saveValue} onDelete={async () => {}} busy={busyId === 'new'} isNew />
        </section>
      )}

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

function ValueRow({ value, onSave, onDelete, busy, isNew }: {
  value: AboutValue; onSave: (v: AboutValue) => Promise<void>; onDelete: (id: string) => Promise<void>; busy: boolean; isNew?: boolean
}) {
  const [draft, setDraft] = useState<AboutValue>(value)
  useEffect(() => { setDraft(value) }, [value])

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      isNew ? 'border-secondary/30 bg-secondary/5' : 'border-[rgba(255,255,255,0.08)] bg-[#1A2236]',
    )}>
      {isNew && <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-3">+ Add new value</p>}
      <div className="grid sm:grid-cols-[80px_1fr_1fr_100px] gap-2 mb-2">
        <Input value={draft.icon_emoji} onChange={(v) => setDraft({ ...draft, icon_emoji: v })} placeholder="🎯" mono />
        <Input value={draft.title_en} onChange={(v) => setDraft({ ...draft, title_en: v })} placeholder="Title EN" />
        <Input value={draft.title_bn} onChange={(v) => setDraft({ ...draft, title_bn: v })} placeholder="শিরোনাম BN" />
        <Input
          value={String(draft.display_order)}
          onChange={(v) => setDraft({ ...draft, display_order: parseInt(v) || 0 })}
          placeholder="0"
          type="number"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <Textarea value={draft.description_en} onChange={(v) => setDraft({ ...draft, description_en: v })} placeholder="Description EN" rows={2} />
        <Textarea value={draft.description_bn} onChange={(v) => setDraft({ ...draft, description_bn: v })} placeholder="বিবরণ BN" rows={2} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            className="accent-secondary"
          />
          Published
        </label>
        <div className="flex items-center gap-2">
          {!isNew && value.id && (
            <button
              onClick={() => onDelete(value.id as string)}
              disabled={busy}
              className="text-xs text-[rgba(255,255,255,0.65)] hover:text-gold flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
          <button
            onClick={() => onSave(draft)}
            disabled={busy || !draft.title_en}
            className="h-9 px-4 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary-dark transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            {isNew ? <><Plus className="w-3 h-3" /> Add</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, mono }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary',
        mono && 'font-mono text-center',
      )}
    />
  )
}

function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
    />
  )
}

function LoadingPanel() {
  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-12 flex items-center justify-center text-[rgba(255,255,255,0.55)]">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
    </div>
  )
}
