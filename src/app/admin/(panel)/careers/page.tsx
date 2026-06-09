'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import type { CareerOpening } from '@/types'

type CareerForm = { title: string; title_bn: string; department: string; type: CareerOpening['type']; location: string; description: string; description_bn: string; requirements: string; published: boolean }
const emptyForm: CareerForm = { title: '', title_bn: '', department: '', type: 'full-time', location: 'Dhaka, Bangladesh', description: '', description_bn: '', requirements: '', published: false }

export default function AdminCareersPage() {
  const [openings, setOpenings] = useState<CareerOpening[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CareerForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchOpenings() }, [])

  async function fetchOpenings() {
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase.from('career_openings').select('*').order('created_at', { ascending: false })
      setOpenings(data ?? [])
    } catch { setOpenings([]) }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('career_openings').insert(form)
      setShowForm(false)
      setForm(emptyForm)
      fetchOpenings()
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(job: CareerOpening) {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('career_openings').update({ published: !job.published }).eq('id', job.id)
    fetchOpenings()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this opening?')) return
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('career_openings').delete().eq('id', id)
    fetchOpenings()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Career Openings</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-xl text-sm hover:bg-secondary-dark transition-colors">
          <Plus className="w-4 h-4" /> New Opening
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Job Title (EN)"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} /></Field>
            <Field label="Job Title (BN)"><input value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })} className={inp} /></Field>
            <Field label="Department"><input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inp} placeholder="e.g. Technology" /></Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CareerOpening['type'] })} className={inp}>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </Field>
            <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inp} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Description (EN)"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} /></Field>
            <Field label="Description (BN)"><textarea rows={3} value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} className={inp} /></Field>
          </div>
          <Field label="Requirements"><textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className={inp} placeholder="List key requirements..." /></Field>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-[#262E44] text-[rgba(255,255,255,0.82)] text-sm font-semibold rounded-xl hover:bg-[rgba(15,23,42,0.65)]">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl divide-y divide-[rgba(255,255,255,0.10)]">
        {loading ? (
          <div className="p-8 text-center text-[rgba(255,255,255,0.65)] text-sm">Loading...</div>
        ) : openings.map((job) => (
          <div key={job.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">{job.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.published ? 'bg-accent/10 text-accent' : 'bg-[rgba(15,23,42,0.55)]/10 text-[rgba(255,255,255,0.65)]'}`}>
                  {job.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.65)] mt-0.5">{job.department} · {job.type} · {job.location}</div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => togglePublish(job)} className="p-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:bg-[#262E44] hover:text-white transition-colors">
                {job.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => handleDelete(job.id)} className="p-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:bg-gold/10 hover:text-gold transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {!loading && openings.length === 0 && (
          <div className="p-8 text-center text-[rgba(255,255,255,0.65)] text-sm">No career openings. Click &ldquo;New Opening&rdquo; to add one.</div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-[rgba(255,255,255,0.65)] block mb-1">{label}</label>{children}</div>
}

const inp = 'w-full px-3 py-2.5 bg-primary border border-[rgba(255,255,255,0.12)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary placeholder-[rgba(255,255,255,0.40)] resize-none'
