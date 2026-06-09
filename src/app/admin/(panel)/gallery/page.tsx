'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import type { GalleryItem } from '@/types'

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', title_bn: '', image_url: '', category: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const res = await fetch('/api/gallery')
    const data = await res.json()
    if (data.success) setItems(data.data)
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowForm(false)
    setForm({ title: '', title_bn: '', image_url: '', category: '' })
    fetchItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return
    await fetch('/api/gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchItems()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Gallery</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors text-sm">
          <Plus className="w-4 h-4" /> Add Image
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">Add Gallery Image</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs text-[rgba(255,255,255,0.65)] block mb-1">Title (EN)</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} placeholder="Image title" /></div>
            <div><label className="text-xs text-[rgba(255,255,255,0.65)] block mb-1">Title (BN)</label><input value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })} className={input} placeholder="চিত্রের শিরোনাম" /></div>
            <div className="sm:col-span-2">
              <ImageUploader
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
                folder="gallery"
                label="Image"
                aspect="auto"
              />
            </div>
            <div><label className="text-xs text-[rgba(255,255,255,0.65)] block mb-1">Category</label><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input} placeholder="e.g. Events" /></div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary-dark transition-colors disabled:opacity-60">{saving ? 'Adding...' : 'Add'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-[#262E44] text-[rgba(255,255,255,0.82)] text-sm font-semibold rounded-xl hover:bg-[rgba(15,23,42,0.65)] transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-[rgba(255,255,255,0.65)] py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.12)] bg-[#1A2236]">
              <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" loading="lazy" />
              <div className="p-3">
                <p className="text-sm font-medium text-white truncate">{item.title}</p>
                <p className="text-xs text-[rgba(255,255,255,0.65)]">{item.category}</p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 w-7 h-7 bg-gold/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-full text-center text-[rgba(255,255,255,0.65)] py-10">No gallery items.</div>}
        </div>
      )}
    </div>
  )
}

const input = 'w-full px-3 py-2.5 bg-primary border border-[rgba(255,255,255,0.12)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary placeholder-[rgba(255,255,255,0.40)]'
