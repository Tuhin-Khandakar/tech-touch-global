'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2 } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import { useToast, default as ToastStack } from '@/components/admin/Toast'
import { cn } from '@/lib/utils'

// ── Field metadata — drives the entire UI ───────────────────────────────
type FieldKind = 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'image'

interface FieldDef {
  key:    string
  label:  string
  kind:   FieldKind
  hint?:  string
  /** For image fields */
  folder?: 'settings' | 'blog' | 'gallery' | 'countries' | 'services' | 'team' | 'testimonials' | 'about'
}

interface SectionDef {
  id:    string
  title: string
  intro: string
  fields: FieldDef[]
}

const SECTIONS: SectionDef[] = [
  {
    id:    'brand',
    title: 'Brand',
    intro: 'Identity and visuals shown across the site.',
    fields: [
      { key: 'company.name',         label: 'Company name',          kind: 'text' },
      { key: 'company.tagline_en',   label: 'Tagline (English)',     kind: 'text' },
      { key: 'company.tagline_bn',   label: 'Tagline (Bangla)',      kind: 'text' },
      { key: 'media.logo_url',       label: 'Logo',                  kind: 'image', folder: 'settings', hint: 'Used in the header and footer' },
      { key: 'media.logo_alt',       label: 'Logo alt text',         kind: 'text',  hint: 'For screen readers and SEO' },
      { key: 'media.favicon_url',    label: 'Favicon',               kind: 'image', folder: 'settings', hint: 'Browser tab icon — square PNG/ICO recommended' },
      { key: 'media.og_image_url',   label: 'Default share image',   kind: 'image', folder: 'settings', hint: 'Shown when the site is shared on Facebook, WhatsApp, etc.' },
    ],
  },
  {
    id:    'contact',
    title: 'Contact',
    intro: 'How customers reach you. Used in the header, footer, and contact page.',
    fields: [
      { key: 'contact.phone',        label: 'Phone',                 kind: 'tel' },
      { key: 'contact.whatsapp',     label: 'WhatsApp',              kind: 'tel',   hint: 'Include country code, e.g. +880…' },
      { key: 'contact.email',        label: 'Email',                 kind: 'email' },
      { key: 'contact.address_en',   label: 'Address (English)',     kind: 'text' },
      { key: 'contact.address_bn',   label: 'Address (Bangla)',      kind: 'text' },
      { key: 'hours.weekdays_en',    label: 'Weekday hours (EN)',    kind: 'text' },
      { key: 'hours.weekdays_bn',    label: 'Weekday hours (BN)',    kind: 'text' },
      { key: 'hours.weekend_en',     label: 'Weekend hours (EN)',    kind: 'text' },
      { key: 'hours.weekend_bn',     label: 'Weekend hours (BN)',    kind: 'text' },
      { key: 'maps.embed_url',       label: 'Google Maps embed URL', kind: 'url',   hint: 'Paste the src URL from Google Maps → Share → Embed a map' },
    ],
  },
  {
    id:    'social',
    title: 'Social media',
    intro: 'Linked from the footer icons.',
    fields: [
      { key: 'social.facebook',      label: 'Facebook URL',          kind: 'url' },
      { key: 'social.linkedin',      label: 'LinkedIn URL',          kind: 'url' },
      { key: 'social.youtube',       label: 'YouTube URL',           kind: 'url' },
    ],
  },
  {
    id:    'payments',
    title: 'Payment accounts',
    intro: 'Displayed on the payment page so customers know where to send money.',
    fields: [
      { key: 'payments.bkash',         label: 'bKash number',        kind: 'tel' },
      { key: 'payments.nagad',         label: 'Nagad number',        kind: 'tel' },
      { key: 'payments.bank_account',  label: 'Bank account number', kind: 'text' },
      { key: 'payments.bank_name',     label: 'Bank name',           kind: 'text' },
      { key: 'payments.bank_routing',  label: 'Bank routing number', kind: 'text' },
    ],
  },
  {
    id:    'footer',
    title: 'Footer',
    intro: 'Short blurb shown in the footer next to the logo.',
    fields: [
      { key: 'footer.blurb_en',      label: 'Footer blurb (EN)',     kind: 'textarea' },
      { key: 'footer.blurb_bn',      label: 'Footer blurb (BN)',     kind: 'textarea' },
    ],
  },
  {
    id:    'seo',
    title: 'SEO defaults',
    intro: "Used when a page doesn't set its own meta tags.",
    fields: [
      { key: 'seo.title_en',         label: 'Default title (EN)',         kind: 'text' },
      { key: 'seo.title_bn',         label: 'Default title (BN)',         kind: 'text' },
      { key: 'seo.description_en',   label: 'Default description (EN)',   kind: 'textarea' },
      { key: 'seo.description_bn',   label: 'Default description (BN)',   kind: 'textarea' },
      { key: 'seo.keywords_en',      label: 'Keywords (EN)',              kind: 'text',  hint: 'Comma-separated' },
      { key: 'seo.keywords_bn',      label: 'Keywords (BN)',              kind: 'text',  hint: 'Comma-separated' },
    ],
  },
]

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key))

// ── Page ───────────────────────────────────────────────────────────────
// Seed all known keys with empty strings so the form ALWAYS renders, even
// if the DB has zero rows or the fetch fails.
function emptyValues(): Record<string, string> {
  const v: Record<string, string> = {}
  for (const k of ALL_KEYS) v[k] = ''
  return v
}

export default function AdminSettingsPage() {
  const [values,  setValues]  = useState<Record<string, string>>(emptyValues)
  const [initial, setInitial] = useState<Record<string, string>>(emptyValues)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [loadError, setLoadError] = useState<string>('')
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id)
  const { toasts, push, remove } = useToast()

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      const data = await res.json()
      if (!data.success) {
        const msg = data.error === 'unauthorized'
          ? 'Your session expired. Please sign in again.'
          : (data.error ?? 'Failed to load settings')
        setLoadError(msg)
        push('error', msg)
        // Keep the seeded empty form visible so the page is never blank.
        setLoading(false)
        return
      }
      const v = emptyValues()
      for (const row of (data.data ?? []) as Array<{ key: string; value: string }>) {
        if (row.key in v) v[row.key] = row.value ?? ''
      }
      setValues(v)
      setInitial(v)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error loading settings'
      setLoadError(msg)
      push('error', msg)
    }
    setLoading(false)
  }, [push])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const dirty = Object.keys(values).some((k) => values[k] !== initial[k])

  function setField(key: string, value: string): void {
    setValues((cur) => ({ ...cur, [key]: value }))
  }

  async function save(): Promise<void> {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const changed: Record<string, string> = {}
      for (const k of Object.keys(values)) {
        if (values[k] !== initial[k]) changed[k] = values[k]
      }
      const res = await fetch('/api/admin/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ settings: changed }),
      })
      const data = await res.json()
      if (!data.success) {
        push('error', data.error ?? 'Save failed')
        return
      }
      push('success', `Saved ${data.count} setting${data.count === 1 ? '' : 's'}`)
      setInitial({ ...values })
    } catch {
      push('error', 'Network error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Settings</h1>
          <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">
            Brand, contact, social, SEO and payment details that appear across the public site.
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving || loading}
          className={cn(
            'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all',
            'bg-secondary text-white shadow-brand hover:bg-secondary-dark hover:shadow-brand-hover',
            'disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed',
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>

      {loadError && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-gold/10 border border-gold/30 text-sm text-gold">
          <span className="font-semibold">Could not load saved settings:</span>
          <span className="flex-1">{loadError}</span>
          <button
            onClick={fetchSettings}
            className="shrink-0 underline underline-offset-2 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[200px_1fr] gap-6">
        <nav className="hidden lg:flex flex-col gap-1 sticky top-20 self-start">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id)
                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className={cn(
                'text-left px-3 py-2 rounded-lg text-sm transition-colors',
                activeSection === s.id
                  ? 'bg-secondary/15 text-secondary font-semibold'
                  : 'text-[rgba(255,255,255,0.65)] hover:bg-[#1A2236] hover:text-white',
              )}
            >
              {s.title}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-5 min-w-0">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.55)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading saved values…
            </div>
          )}
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden"
            >
              <header className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                <h2 className="font-display font-bold text-white tracking-tight">{section.title}</h2>
                <p className="text-xs text-[rgba(255,255,255,0.55)] mt-0.5">{section.intro}</p>
              </header>
              <div className="p-4 sm:p-6 grid gap-5 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <FieldEditor
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ''}
                    onChange={(v) => setField(field.key, v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  )
}

interface FieldEditorProps {
  field:    FieldDef
  value:    string
  onChange: (v: string) => void
}

function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const { kind, label, hint, key } = field
  const id = `f-${key.replace(/\./g, '_')}`

  if (kind === 'image') {
    return (
      <div className="sm:col-span-2">
        <ImageUploader
          value={value}
          onChange={onChange}
          folder={field.folder ?? 'settings'}
          label={label}
          hint={hint}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1.5', kind === 'textarea' && 'sm:col-span-2')}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.55)]">
        {label}
      </label>
      {kind === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none transition-colors"
        />
      ) : (
        <input
          id={id}
          type={kind}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-[#0F172A] border border-[rgba(255,255,255,0.10)] rounded-xl text-sm text-white placeholder-[rgba(255,255,255,0.40)] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors"
        />
      )}
      {hint && <p className="text-[11px] text-[rgba(255,255,255,0.45)] leading-snug">{hint}</p>}
    </div>
  )
}
