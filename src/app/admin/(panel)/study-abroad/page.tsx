'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Globe, Search, Loader2 } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn, slugify } from '@/lib/utils'
import type { StudyCountry } from '@/types'

const EMPTY: Partial<StudyCountry> = {
  slug: '',
  name: '',
  name_bn: '',
  flag_emoji: '🌍',
  image_url: '',
  description: '',
  description_bn: '',
  tuition_range: '',
  scholarship_info: '',
  visa_process: '',
  intake_dates: '',
  job_opportunities: '',
  top_universities: [],
  display_order: 0,
  published: false,
}

export default function AdminStudyAbroadPage() {
  const [list,    setList]    = useState<StudyCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [editing, setEditing] = useState<Partial<StudyCountry> | null>(null)
  const [busyId,  setBusyId]  = useState<string | null>(null)
  const { toasts, push, remove } = useToast()

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/countries')
      const data = await res.json()
      if (data.success) setList(data.data as StudyCountry[])
      else push('error', data.error ?? 'Failed to load countries')
    } catch {
      push('error', 'Network error loading countries')
    }
    setLoading(false)
  }, [push])

  useEffect(() => { fetchList() }, [fetchList])

  async function togglePublish(c: StudyCountry): Promise<void> {
    setBusyId(c.id)
    try {
      const res = await fetch(`/api/admin/countries/${c.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ published: !c.published }),
      })
      const data = await res.json()
      if (data.success) {
        setList((cur) => cur.map((x) => (x.id === c.id ? { ...x, published: !x.published } : x)))
        push('success', !c.published ? 'Published — live on the public site' : 'Unpublished — hidden from public site')
      } else {
        push('error', data.error ?? 'Update failed')
      }
    } catch {
      push('error', 'Network error')
    }
    setBusyId(null)
  }

  async function moveOrder(c: StudyCountry, dir: -1 | 1): Promise<void> {
    setBusyId(c.id)
    try {
      const next = (c.display_order ?? 0) + dir
      await fetch(`/api/admin/countries/${c.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ display_order: next }),
      })
      await fetchList()
    } catch {
      push('error', 'Reorder failed')
    }
    setBusyId(null)
  }

  async function removeCountry(c: StudyCountry): Promise<void> {
    if (!confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return
    setBusyId(c.id)
    try {
      const res = await fetch(`/api/admin/countries/${c.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setList((cur) => cur.filter((x) => x.id !== c.id))
        push('success', `Deleted ${c.name}`)
      } else {
        push('error', data.error ?? 'Delete failed')
      }
    } catch {
      push('error', 'Network error')
    }
    setBusyId(null)
  }

  const filtered = list.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.name_bn.toLowerCase().includes(q)
  })

  if (editing) {
    return (
      <CountryEditor
        initial={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          await fetchList()
          setEditing(null)
          push('success', editing.id ? 'Saved changes' : 'Country added — live on the public site')
        }}
        onError={(msg) => push('error', msg)}
      />
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Study Abroad — Countries</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
            {list.length} country/-ies · published rows appear on the public site.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.45)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full h-10 pl-10 pr-3 bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            />
          </div>
          <button
            onClick={() => setEditing(EMPTY)}
            className="inline-flex items-center gap-2 h-10 px-4 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add country
          </button>
        </div>
      </div>

      <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-16 text-center text-[rgba(255,255,255,0.55)] text-sm">
            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-[rgba(255,255,255,0.55)] text-sm">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {search ? <>No matches for &ldquo;{search}&rdquo;</> : <>No countries yet — click &ldquo;Add country&rdquo;</>}
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[rgba(255,255,255,0.06)] overflow-hidden flex items-center justify-center shrink-0">
                  {c.image_url
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl">{c.flag_emoji || '🌍'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-white text-sm">{c.name}</span>
                    {c.name_bn && <span className="text-xs text-[rgba(255,255,255,0.55)]">· {c.name_bn}</span>}
                    <span className={cn(
                      'shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                      c.published ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-white/8 text-[rgba(255,255,255,0.65)] border border-white/10',
                    )}>
                      {c.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.55)] font-mono truncate">
                    /study-abroad/{c.slug} · order #{c.display_order ?? 0}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconBtn title="Move up" onClick={() => moveOrder(c, -1)} disabled={busyId === c.id}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn title="Move down" onClick={() => moveOrder(c, 1)} disabled={busyId === c.id}>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn title={c.published ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(c)} disabled={busyId === c.id}>
                    {c.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </IconBtn>
                  <IconBtn title="Edit" onClick={() => setEditing(c)} disabled={busyId === c.id}>
                    <Pencil className="w-3.5 h-3.5" />
                  </IconBtn>
                  <IconBtn title="Delete" onClick={() => removeCountry(c)} disabled={busyId === c.id} variant="danger">
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────
interface EditorProps {
  initial: Partial<StudyCountry>
  onClose: () => void
  onSaved: () => Promise<void> | void
  onError: (msg: string) => void
}

function CountryEditor({ initial, onClose, onSaved, onError }: EditorProps) {
  const [form, setForm] = useState<Partial<StudyCountry>>({ ...initial })
  const [saving, setSaving] = useState(false)
  const [universitiesText, setUniversitiesText] = useState(
    (initial.top_universities ?? []).join('\n'),
  )

  function update<K extends keyof StudyCountry>(key: K, value: StudyCountry[K]): void {
    setForm((cur) => ({ ...cur, [key]: value }))
  }

  function maybeAutoSlug(name: string): void {
    update('name', name)
    if (!initial.id && (!form.slug || form.slug === slugify(form.name ?? ''))) {
      update('slug', slugify(name))
    }
  }

  async function save(): Promise<void> {
    if (saving) return
    if (!(form.name ?? '').trim() || !(form.slug ?? '').trim()) {
      onError('Name and slug are required')
      return
    }
    setSaving(true)
    try {
      const universities = universitiesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = { ...form, top_universities: universities }
      const url    = initial.id ? `/api/admin/countries/${initial.id}` : '/api/admin/countries'
      const method = initial.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) {
        onError(data.error === 'slug_taken' ? 'A country with that slug already exists' : (data.error ?? 'Save failed'))
        setSaving(false)
        return
      }
      await onSaved()
    } catch {
      onError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <button onClick={onClose} className="text-xs text-[rgba(255,255,255,0.65)] hover:text-white mb-2 inline-flex items-center gap-1">
            ← Back to list
          </button>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            {initial.id ? `Edit ${initial.name ?? 'country'}` : 'Add country'}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-xs text-white px-3 py-2 rounded-xl bg-[#1A2236] border border-[rgba(255,255,255,0.10)] cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.published}
              onChange={(e) => update('published', e.target.checked)}
              className="accent-secondary"
            />
            Published
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-5 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors disabled:opacity-40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : initial.id ? 'Save changes' : 'Create country'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card title="Identity">
          <Grid>
            <Field label="Name (English)">
              <Input value={form.name ?? ''} onChange={(v) => maybeAutoSlug(v)} placeholder="United Kingdom" />
            </Field>
            <Field label="Name (Bangla)">
              <Input value={form.name_bn ?? ''} onChange={(v) => update('name_bn', v)} placeholder="যুক্তরাজ্য" />
            </Field>
            <Field label="Slug" hint="URL segment — letters, numbers, hyphens only">
              <Input value={form.slug ?? ''} onChange={(v) => update('slug', slugify(v))} placeholder="uk" mono />
            </Field>
            <Field label="Flag emoji" hint="Shown when no cover image is set">
              <Input value={form.flag_emoji ?? ''} onChange={(v) => update('flag_emoji', v)} placeholder="🇬🇧" />
            </Field>
            <Field label="Display order" hint="Lower numbers appear first">
              <Input
                type="number"
                value={String(form.display_order ?? 0)}
                onChange={(v) => update('display_order', parseInt(v) || 0)}
              />
            </Field>
          </Grid>
        </Card>

        <Card title="Cover image" intro="Shown at the top of the country page. Falls back to the flag emoji if empty.">
          <ImageUploader
            value={form.image_url ?? ''}
            onChange={(url) => update('image_url', url)}
            folder="countries"
            aspect="16/9"
          />
        </Card>

        <Card title="Short description">
          <Grid>
            <Field label="Description (English)">
              <TextArea value={form.description ?? ''} onChange={(v) => update('description', v)} rows={4} placeholder="1–2 sentence summary…" />
            </Field>
            <Field label="Description (Bangla)">
              <TextArea value={form.description_bn ?? ''} onChange={(v) => update('description_bn', v)} rows={4} placeholder="বাংলায় সারসংক্ষেপ…" />
            </Field>
          </Grid>
        </Card>

        <Card title="Key facts" intro="Each block becomes a tile on the public country page.">
          <Grid>
            <Field label="Tuition range">
              <Input value={form.tuition_range ?? ''} onChange={(v) => update('tuition_range', v)} placeholder="£10,000 – £38,000 per year" />
            </Field>
            <Field label="Intake dates">
              <Input value={form.intake_dates ?? ''} onChange={(v) => update('intake_dates', v)} placeholder="Primary: September." />
            </Field>
            <Field label="Scholarship info" full>
              <TextArea value={form.scholarship_info ?? ''} onChange={(v) => update('scholarship_info', v)} rows={3} />
            </Field>
            <Field label="Visa process" full>
              <TextArea value={form.visa_process ?? ''} onChange={(v) => update('visa_process', v)} rows={3} />
            </Field>
            <Field label="Job opportunities" full>
              <TextArea value={form.job_opportunities ?? ''} onChange={(v) => update('job_opportunities', v)} rows={3} />
            </Field>
          </Grid>
        </Card>

        <Card title="Top universities" intro="One name per line.">
          <TextArea
            value={universitiesText}
            onChange={setUniversitiesText}
            rows={6}
            placeholder={'University of Oxford\nUniversity of Cambridge\nImperial College London'}
            mono
          />
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 h-11 px-6 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors disabled:opacity-40"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial.id ? 'Save changes' : 'Create country'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="h-11 px-5 text-sm text-[rgba(255,255,255,0.65)] hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Tiny UI primitives ───
interface IconBtnProps { children: React.ReactNode; onClick: () => void; title: string; disabled?: boolean; variant?: 'danger' }
function IconBtn({ children, onClick, title, disabled, variant }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
        variant === 'danger'
          ? 'text-[rgba(255,255,255,0.65)] hover:text-gold hover:bg-gold/10'
          : 'text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

function Card({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
      <header className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <h2 className="font-display font-bold text-white tracking-tight">{title}</h2>
        {intro && <p className="text-xs text-[rgba(255,255,255,0.55)] mt-0.5">{intro}</p>}
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>
}

function Field({ label, hint, full, children }: { label: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[rgba(255,255,255,0.45)] leading-snug">{hint}</p>}
    </div>
  )
}

interface InputProps { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; mono?: boolean }
function Input({ value, onChange, type = 'text', placeholder, mono }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary',
        mono && 'font-mono',
      )}
    />
  )
}

interface TextAreaProps { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; mono?: boolean }
function TextArea({ value, onChange, rows = 3, placeholder, mono }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={cn(
        'w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none',
        mono && 'font-mono',
      )}
    />
  )
}
