'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

interface SiteContentRow {
  key:        string
  value_en:   string
  value_bn:   string
  description: string
  group_name: string
  kind:       string
}

interface HomeStat {
  id?:           string
  number_text:   string
  label_en:      string
  label_bn:      string
  hint_en:       string
  hint_bn:       string
  display_order: number
  published:     boolean
}

interface WhyItem {
  id?:           string
  title_en:      string
  title_bn:      string
  body_en:       string
  body_bn:       string
  display_order: number
  published:     boolean
}

const TABS = [
  { id: 'text',  label: 'Text content', intro: 'Headlines, intros, CTAs across the public site. Stored in site_content.' },
  { id: 'stats', label: 'Home stats',   intro: 'The four-tile strip after the hero. Add, edit, reorder, hide.' },
  { id: 'why',   label: 'Why choose us', intro: 'Numbered feature list on the homepage and About page.' },
] as const
type TabId = typeof TABS[number]['id']

export default function AdminContentPage() {
  const [tab, setTab] = useState<TabId>('text')
  const { toasts, push, remove } = useToast()

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Content</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">{TABS.find((t) => t.id === tab)?.intro}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-xl p-1 max-w-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 h-9 rounded-lg text-sm font-semibold transition-all',
              tab === t.id ? 'bg-secondary text-white shadow-brand' : 'text-[rgba(255,255,255,0.65)] hover:text-white',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'text'  && <TextEditor   pushToast={push} />}
      {tab === 'stats' && <StatsEditor  pushToast={push} />}
      {tab === 'why'   && <WhyEditor    pushToast={push} />}

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

// ─── Bilingual key/value text editor ────────────────────────────────────
function TextEditor({ pushToast }: { pushToast: (kind: 'success' | 'error' | 'info', msg: string) => void }) {
  const [rows,    setRows]    = useState<SiteContentRow[]>([])
  const [values,  setValues]  = useState<Record<string, { en: string; bn: string }>>({})
  const [initial, setInitial] = useState<Record<string, { en: string; bn: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/site-content')
      const data = await res.json()
      if (!data.success) {
        pushToast('error', data.error ?? 'Failed to load')
        return
      }
      const rs = data.data as SiteContentRow[]
      setRows(rs)
      const map: Record<string, { en: string; bn: string }> = {}
      for (const r of rs) map[r.key] = { en: r.value_en, bn: r.value_bn }
      setValues(map)
      setInitial(JSON.parse(JSON.stringify(map)))
    } catch {
      pushToast('error', 'Network error')
    }
    setLoading(false)
  }, [pushToast])

  useEffect(() => { fetchRows() }, [fetchRows])

  const grouped = useMemo(() => {
    const out: Record<string, SiteContentRow[]> = {}
    for (const r of rows) {
      const g = r.group_name || 'general'
      out[g] = out[g] ? [...out[g], r] : [r]
    }
    return out
  }, [rows])

  const dirty = useMemo(() => {
    for (const k of Object.keys(values)) {
      if (values[k].en !== initial[k]?.en || values[k].bn !== initial[k]?.bn) return true
    }
    return false
  }, [values, initial])

  function setField(key: string, lang: 'en' | 'bn', v: string): void {
    setValues((cur) => ({ ...cur, [key]: { en: cur[key]?.en ?? '', bn: cur[key]?.bn ?? '', [lang]: v } }))
  }

  async function save(): Promise<void> {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const entries: Record<string, { en?: string; bn?: string }> = {}
      for (const k of Object.keys(values)) {
        const patch: { en?: string; bn?: string } = {}
        if (values[k].en !== initial[k]?.en) patch.en = values[k].en
        if (values[k].bn !== initial[k]?.bn) patch.bn = values[k].bn
        if (Object.keys(patch).length > 0) entries[k] = patch
      }
      const res = await fetch('/api/admin/site-content', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entries }),
      })
      const data = await res.json()
      if (!data.success) {
        pushToast('error', data.error ?? 'Save failed')
        return
      }
      pushToast('success', `Saved ${data.count} entries — live on the public site`)
      setInitial(JSON.parse(JSON.stringify(values)))
    } catch {
      pushToast('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingPanel />
  if (rows.length === 0) {
    return <EmptyPanel message="No content rows seeded. Run the CMS migration to populate site_content." />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 h-10 px-5 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-all disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <header className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="font-display font-bold text-white capitalize">{group}</h2>
          </header>
          <div className="p-6 space-y-5">
            {items.map((row) => (
              <div key={row.key} className="border-b border-[rgba(255,255,255,0.05)] pb-5 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-[11px] font-mono text-secondary">{row.key}</code>
                  {row.description && <span className="text-[10px] text-[rgba(255,255,255,0.55)]">{row.description}</span>}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <BilingualInput
                    value={values[row.key]?.en ?? ''}
                    onChange={(v) => setField(row.key, 'en', v)}
                    rows={row.kind === 'rich' ? 3 : 1}
                    placeholder="English"
                    flag="EN"
                  />
                  <BilingualInput
                    value={values[row.key]?.bn ?? ''}
                    onChange={(v) => setField(row.key, 'bn', v)}
                    rows={row.kind === 'rich' ? 3 : 1}
                    placeholder="Bangla"
                    flag="BN"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function BilingualInput({ value, onChange, rows, placeholder, flag }: {
  value: string; onChange: (v: string) => void; rows: number; placeholder: string; flag: string
}) {
  if (rows > 1) {
    return (
      <label className="block relative">
        <span className="absolute top-2 right-2 text-[9px] font-bold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">{flag}</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
        />
      </label>
    )
  }
  return (
    <label className="block relative">
      <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[9px] font-bold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">{flag}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-12 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
      />
    </label>
  )
}

// ─── Stats editor ──────────────────────────────────────────────────────
function StatsEditor({ pushToast }: { pushToast: (kind: 'success' | 'error' | 'info', msg: string) => void }) {
  const [items, setItems] = useState<HomeStat[]>([])
  const [loading, setLoading] = useState(true)
  const [busy,  setBusy]  = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/home-stats')
      const data = await res.json()
      if (data.success) setItems(data.data as HomeStat[])
      else pushToast('error', data.error ?? 'Failed')
    } catch { pushToast('error', 'Network error') }
    setLoading(false)
  }, [pushToast])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function save(item: HomeStat): Promise<void> {
    setBusy(item.id ?? 'new')
    try {
      const res = await fetch('/api/admin/home-stats', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(item),
      })
      const data = await res.json()
      if (!data.success) {
        pushToast('error', data.error ?? 'Save failed')
        setBusy(null)
        return
      }
      await fetchItems()
      pushToast('success', 'Saved — live on the public site')
    } catch {
      pushToast('error', 'Network error')
    }
    setBusy(null)
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Delete this stat?')) return
    setBusy(id)
    try {
      const res = await fetch('/api/admin/home-stats', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchItems()
        pushToast('success', 'Deleted')
      } else {
        pushToast('error', data.error ?? 'Delete failed')
      }
    } catch {
      pushToast('error', 'Network error')
    }
    setBusy(null)
  }

  if (loading) return <LoadingPanel />

  return (
    <div className="space-y-4">
      {items.map((s) => <StatRow key={s.id} stat={s} onSave={save} onRemove={remove} busy={busy === s.id} />)}
      <StatRow
        stat={{ number_text: '', label_en: '', label_bn: '', hint_en: '', hint_bn: '', display_order: items.length, published: true }}
        onSave={save}
        onRemove={async () => {}}
        busy={busy === 'new'}
        isNew
      />
    </div>
  )
}

function StatRow({ stat, onSave, onRemove, busy, isNew }: {
  stat: HomeStat; onSave: (s: HomeStat) => Promise<void>; onRemove: (id: string) => Promise<void>; busy: boolean; isNew?: boolean
}) {
  const [draft, setDraft] = useState(stat)
  useEffect(() => { setDraft(stat) }, [stat])

  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-5">
      {isNew && <p className="text-xs text-secondary font-semibold mb-3 uppercase tracking-wider">+ Add new stat</p>}
      <div className="grid sm:grid-cols-[120px_1fr_1fr_1fr_1fr] gap-3 mb-3">
        <Input label="Number" value={draft.number_text} onChange={(v) => setDraft({ ...draft, number_text: v })} placeholder="500+" mono />
        <Input label="Label EN" value={draft.label_en} onChange={(v) => setDraft({ ...draft, label_en: v })} placeholder="Clients" />
        <Input label="Label BN" value={draft.label_bn} onChange={(v) => setDraft({ ...draft, label_bn: v })} placeholder="ক্লায়েন্ট" />
        <Input label="Hint EN" value={draft.hint_en} onChange={(v) => setDraft({ ...draft, hint_en: v })} placeholder="across …" />
        <Input label="Hint BN" value={draft.hint_bn} onChange={(v) => setDraft({ ...draft, hint_bn: v })} placeholder="বাংলায়…" />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
          <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} className="accent-secondary" />
          Published
        </label>
        <div className="flex items-center gap-2">
          {!isNew && stat.id && (
            <button onClick={() => onRemove(stat.id as string)} disabled={busy} className="text-xs text-[rgba(255,255,255,0.65)] hover:text-gold flex items-center gap-1 disabled:opacity-50">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
          <button
            onClick={() => onSave(draft)}
            disabled={busy || !draft.number_text || !draft.label_en}
            className="h-9 px-4 bg-secondary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary-dark transition-colors disabled:opacity-40"
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            {isNew ? 'Add stat' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Why-Choose-Us editor ──────────────────────────────────────────────
function WhyEditor({ pushToast }: { pushToast: (kind: 'success' | 'error' | 'info', msg: string) => void }) {
  const [items, setItems] = useState<WhyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy,    setBusy]    = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/why-items')
      const data = await res.json()
      if (data.success) setItems(data.data as WhyItem[])
      else pushToast('error', data.error ?? 'Failed')
    } catch { pushToast('error', 'Network error') }
    setLoading(false)
  }, [pushToast])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function save(item: WhyItem): Promise<void> {
    setBusy(item.id ?? 'new')
    try {
      const res = await fetch('/api/admin/why-items', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(item),
      })
      const data = await res.json()
      if (!data.success) {
        pushToast('error', data.error ?? 'Save failed')
        setBusy(null)
        return
      }
      await fetchItems()
      pushToast('success', 'Saved')
    } catch {
      pushToast('error', 'Network error')
    }
    setBusy(null)
  }

  async function remove(id: string): Promise<void> {
    if (!confirm('Delete this item?')) return
    setBusy(id)
    try {
      const res = await fetch('/api/admin/why-items', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchItems()
        pushToast('success', 'Deleted')
      } else {
        pushToast('error', data.error ?? 'Delete failed')
      }
    } catch {
      pushToast('error', 'Network error')
    }
    setBusy(null)
  }

  if (loading) return <LoadingPanel />

  return (
    <div className="space-y-4">
      {items.map((it) => <WhyRow key={it.id} item={it} onSave={save} onRemove={remove} busy={busy === it.id} />)}
      <WhyRow
        item={{ title_en: '', title_bn: '', body_en: '', body_bn: '', display_order: items.length, published: true }}
        onSave={save}
        onRemove={async () => {}}
        busy={busy === 'new'}
        isNew
      />
    </div>
  )
}

function WhyRow({ item, onSave, onRemove, busy, isNew }: {
  item: WhyItem; onSave: (s: WhyItem) => Promise<void>; onRemove: (id: string) => Promise<void>; busy: boolean; isNew?: boolean
}) {
  const [draft, setDraft] = useState(item)
  useEffect(() => { setDraft(item) }, [item])

  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-5">
      {isNew && <p className="text-xs text-secondary font-semibold mb-3 uppercase tracking-wider">+ Add new item</p>}
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <Input label="Title EN" value={draft.title_en} onChange={(v) => setDraft({ ...draft, title_en: v })} placeholder="Multi-Sector Expertise" />
        <Input label="Title BN" value={draft.title_bn} onChange={(v) => setDraft({ ...draft, title_bn: v })} placeholder="বহু-খাতের দক্ষতা" />
        <Textarea label="Body EN" value={draft.body_en} onChange={(v) => setDraft({ ...draft, body_en: v })} rows={3} />
        <Textarea label="Body BN" value={draft.body_bn} onChange={(v) => setDraft({ ...draft, body_bn: v })} rows={3} />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
          <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} className="accent-secondary" />
          Published
        </label>
        <div className="flex items-center gap-2">
          {!isNew && item.id && (
            <button onClick={() => onRemove(item.id as string)} disabled={busy} className="text-xs text-[rgba(255,255,255,0.65)] hover:text-gold flex items-center gap-1 disabled:opacity-50">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
          <button
            onClick={() => onSave(draft)}
            disabled={busy || !draft.title_en}
            className="h-9 px-4 bg-secondary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary-dark transition-colors disabled:opacity-40"
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
            {isNew ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Atoms ──────────────────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary',
          mono && 'font-mono',
        )}
      />
    </label>
  )
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
      />
    </label>
  )
}

function LoadingPanel() {
  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-12 flex items-center justify-center text-[rgba(255,255,255,0.55)]">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-12 text-center text-[rgba(255,255,255,0.55)] text-sm">
      {message}
    </div>
  )
}
