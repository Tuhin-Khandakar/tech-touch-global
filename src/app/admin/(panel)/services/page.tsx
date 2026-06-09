'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Save, Plus, Trash2, ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

interface Service {
  id:             string
  slug:           string
  title_en:       string
  title_bn:       string
  intro_en:       string
  intro_bn:       string
  body_en:        string
  body_bn:        string
  icon_name:      string
  icon_emoji?:    string
  cover_image?:   string
  accent:         'primary' | 'secondary' | 'accent' | 'gold'
  display_order:  number
  published:      boolean
}

interface ServiceItem {
  id?:            string
  service_id:     string
  title_en:       string
  title_bn:       string
  description_en: string
  description_bn: string
  icon_emoji:     string
  display_order:  number
  published:      boolean
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<Service | null>(null)
  const [loading,  setLoading]  = useState(true)
  const { toasts, push, remove } = useToast()

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      if (data.success) setServices(data.data as Service[])
      else push('error', data.error ?? 'Failed to load services')
    } catch { push('error', 'Network error') }
    setLoading(false)
  }, [push])

  useEffect(() => { fetchServices() }, [fetchServices])

  if (selected) {
    return <ServiceEditor service={selected} onBack={() => { setSelected(null); fetchServices() }} pushToast={push} toasts={toasts} removeToast={remove} />
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Services</h1>
        <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
          Manage the 7 service categories and the sub-services that appear on their detail pages.
        </p>
      </div>

      {loading ? (
        <LoadingPanel />
      ) : (
        <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelected(s)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0 text-xl">
                    {s.icon_emoji ?? '🔹'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white text-sm">{s.title_en}</span>
                      {s.title_bn && <span className="text-xs text-[rgba(255,255,255,0.55)]">· {s.title_bn}</span>}
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                        s.published ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-white/8 text-[rgba(255,255,255,0.65)] border border-white/10',
                      )}>
                        {s.published ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <div className="text-xs text-[rgba(255,255,255,0.55)] font-mono truncate">
                      /services/{s.slug}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.45)]" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
interface ServiceEditorProps {
  service:     Service
  onBack:      () => void
  pushToast:   (kind: 'success' | 'error' | 'info', msg: string) => void
  toasts:      ReturnType<typeof useToast>['toasts']
  removeToast: (id: number) => void
}

function ServiceEditor({ service, onBack, pushToast, toasts, removeToast }: ServiceEditorProps) {
  const [draft,   setDraft]   = useState<Service>(service)
  const [saving,  setSaving]  = useState(false)
  const [items,   setItems]   = useState<ServiceItem[]>([])
  const [busy,    setBusy]    = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/service-items?service_id=${service.id}`)
      const data = await res.json()
      if (data.success) setItems(data.data as ServiceItem[])
    } catch {}
  }, [service.id])

  useEffect(() => { fetchItems() }, [fetchItems])

  function patch<K extends keyof Service>(key: K, value: Service[K]): void {
    setDraft((cur) => ({ ...cur, [key]: value }))
  }

  async function saveService(): Promise<void> {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/services', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(draft),
      })
      const data = await res.json()
      if (!data.success) { pushToast('error', data.error ?? 'Save failed'); return }
      pushToast('success', 'Service saved — live on the public site')
    } catch { pushToast('error', 'Network error') }
    setSaving(false)
  }

  async function saveItem(item: ServiceItem): Promise<void> {
    setBusy(item.id ?? 'new')
    try {
      const res = await fetch('/api/admin/service-items', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(item),
      })
      const data = await res.json()
      if (!data.success) { pushToast('error', data.error ?? 'Save failed'); setBusy(null); return }
      await fetchItems()
      pushToast('success', 'Sub-service saved')
    } catch { pushToast('error', 'Network error') }
    setBusy(null)
  }

  async function deleteItem(id: string): Promise<void> {
    if (!confirm('Delete this sub-service?')) return
    setBusy(id)
    try {
      const res = await fetch('/api/admin/service-items', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.success) { await fetchItems(); pushToast('success', 'Deleted') }
      else pushToast('error', data.error ?? 'Delete failed')
    } catch { pushToast('error', 'Network error') }
    setBusy(null)
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-xs text-[rgba(255,255,255,0.65)] hover:text-white inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> All services
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">{draft.title_en}</h1>
          <p className="text-xs text-[rgba(255,255,255,0.55)] mt-1 font-mono">/services/{draft.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-white px-3 py-2 rounded-xl bg-[#1A2236] border border-[rgba(255,255,255,0.10)] cursor-pointer">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => patch('published', e.target.checked)}
              className="accent-secondary"
            />
            Published
          </label>
          <button
            onClick={saveService}
            disabled={saving}
            className="h-10 px-5 bg-secondary text-white rounded-xl text-sm font-semibold shadow-brand hover:bg-secondary-dark transition-colors disabled:opacity-40 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save service'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <Card title="Identity">
          <Grid>
            <Field label="Title EN"><Input value={draft.title_en} onChange={(v) => patch('title_en', v)} /></Field>
            <Field label="Title BN"><Input value={draft.title_bn} onChange={(v) => patch('title_bn', v)} /></Field>
            <Field label="Intro EN" full><Textarea value={draft.intro_en} onChange={(v) => patch('intro_en', v)} rows={2} /></Field>
            <Field label="Intro BN" full><Textarea value={draft.intro_bn} onChange={(v) => patch('intro_bn', v)} rows={2} /></Field>
            <Field label="Icon emoji">
              <Input value={draft.icon_emoji ?? ''} onChange={(v) => patch('icon_emoji', v)} placeholder="💻" />
            </Field>
            <Field label="Accent color">
              <select
                value={draft.accent}
                onChange={(e) => patch('accent', e.target.value as Service['accent'])}
                className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="primary">Primary (navy)</option>
                <option value="secondary">Secondary (electric blue)</option>
                <option value="accent">Accent (cyan)</option>
                <option value="gold">Gold</option>
              </select>
            </Field>
            <Field label="Display order">
              <Input type="number" value={String(draft.display_order)} onChange={(v) => patch('display_order', parseInt(v) || 0)} />
            </Field>
          </Grid>
        </Card>

        <Card title="Cover image" intro="Optional. Shown on the detail page hero.">
          <ImageUploader
            value={draft.cover_image ?? ''}
            onChange={(url) => patch('cover_image', url)}
            folder="services"
            aspect="16/9"
          />
        </Card>

        <Card title="Long-form copy" intro="Detailed description rendered on the service detail page (HTML allowed).">
          <Grid>
            <Field label="Body EN" full><Textarea value={draft.body_en} onChange={(v) => patch('body_en', v)} rows={6} /></Field>
            <Field label="Body BN" full><Textarea value={draft.body_bn} onChange={(v) => patch('body_bn', v)} rows={6} /></Field>
          </Grid>
        </Card>

        <Card title="Sub-services" intro={`${items.length} sub-service${items.length === 1 ? '' : 's'} listed on the detail page.`}>
          <div className="space-y-3">
            {items.map((it) => (
              <SubItemRow
                key={it.id}
                item={it}
                onSave={saveItem}
                onDelete={(id) => deleteItem(id)}
                busy={busy === it.id}
              />
            ))}
            <SubItemRow
              item={{
                service_id: service.id,
                title_en: '', title_bn: '', description_en: '', description_bn: '',
                icon_emoji: '🔹', display_order: items.length, published: true,
              }}
              onSave={saveItem}
              onDelete={async () => {}}
              busy={busy === 'new'}
              isNew
            />
          </div>
        </Card>
      </div>

      <ToastStack toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

interface SubItemRowProps {
  item:     ServiceItem
  onSave:   (item: ServiceItem) => Promise<void>
  onDelete: (id: string) => Promise<void>
  busy:     boolean
  isNew?:   boolean
}

function SubItemRow({ item, onSave, onDelete, busy, isNew }: SubItemRowProps) {
  const [draft, setDraft] = useState<ServiceItem>(item)
  useEffect(() => { setDraft(item) }, [item])

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      isNew ? 'border-secondary/30 bg-secondary/5' : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]',
    )}>
      {isNew && <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-3">+ Add new sub-service</p>}
      <div className="grid sm:grid-cols-[80px_1fr_1fr] gap-2 mb-2">
        <Input value={draft.icon_emoji} onChange={(v) => setDraft({ ...draft, icon_emoji: v })} placeholder="🔹" mono />
        <Input value={draft.title_en} onChange={(v) => setDraft({ ...draft, title_en: v })} placeholder="Title (EN)" />
        <Input value={draft.title_bn} onChange={(v) => setDraft({ ...draft, title_bn: v })} placeholder="শিরোনাম (BN)" />
      </div>
      <div className="grid sm:grid-cols-2 gap-2 mb-3">
        <Textarea value={draft.description_en} onChange={(v) => setDraft({ ...draft, description_en: v })} rows={2} placeholder="Description (EN)" />
        <Textarea value={draft.description_bn} onChange={(v) => setDraft({ ...draft, description_bn: v })} rows={2} placeholder="বিবরণ (BN)" />
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
          {!isNew && item.id && (
            <button
              onClick={() => onDelete(item.id as string)}
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
            {isNew ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── atoms ─────────────────────────────────────────────────────────────
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

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">{label}</label>
      {children}
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
        'w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary',
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
      className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
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
