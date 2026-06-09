'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [form, setForm] = useState({ title: '', title_bn: '', excerpt: '', excerpt_bn: '', content: '', content_bn: '', category: '', author: '', cover_image: '', published: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    setLoading(true)
    const res = await fetch('/api/blog')
    const data = await res.json()
    if (data.success) setPosts(data.data)
    setLoading(false)
  }

  function openNew() {
    setEditPost(null)
    setForm({ title: '', title_bn: '', excerpt: '', excerpt_bn: '', content: '', content_bn: '', category: '', author: '', cover_image: '', published: false })
    setShowEditor(true)
  }

  function openEdit(post: BlogPost) {
    setEditPost(post)
    setForm({ title: post.title, title_bn: post.title_bn ?? '', excerpt: post.excerpt, excerpt_bn: post.excerpt_bn ?? '', content: post.content, content_bn: post.content_bn ?? '', category: post.category, author: post.author, cover_image: post.cover_image ?? '', published: post.published })
    setShowEditor(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = editPost ? `/api/blog/${editPost.id}` : '/api/blog'
    const method = editPost ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowEditor(false)
    fetchPosts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    fetchPosts()
  }

  async function togglePublish(post: BlogPost) {
    await fetch(`/api/blog/${post.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !post.published }) })
    fetchPosts()
  }

  if (showEditor) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowEditor(false)} className="text-[rgba(255,255,255,0.65)] hover:text-white">← Back</button>
          <h1 className="text-2xl font-bold text-white">{editPost ? 'Edit Post' : 'New Post'}</h1>
        </div>
        <form onSubmit={handleSave} className="space-y-4 max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title (English)"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={adminInput} placeholder="Blog post title..." /></Field>
            <Field label="Title (Bangla)"><input value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })} className={adminInput} placeholder="ব্লগ পোস্টের শিরোনাম..." /></Field>
            <Field label="Excerpt (English)"><textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className={adminInput} /></Field>
            <Field label="Excerpt (Bangla)"><textarea rows={2} value={form.excerpt_bn} onChange={(e) => setForm({ ...form, excerpt_bn: e.target.value })} className={adminInput} /></Field>
            <Field label="Category"><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={adminInput} placeholder="e.g. Study Abroad" /></Field>
            <Field label="Author"><input required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className={adminInput} placeholder="Author name" /></Field>
            <Field label="Cover image" className="sm:col-span-2">
              <ImageUploader
                value={form.cover_image}
                onChange={(url) => setForm({ ...form, cover_image: url })}
                folder="blog"
                aspect="16/9"
                hint="JPG, PNG or WebP — shown at the top of the blog post"
              />
            </Field>
          </div>
          <Field label="Content (English — HTML supported)">
            <textarea rows={10} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={adminInput} />
          </Field>
          <Field label="Content (Bangla)">
            <textarea rows={10} value={form.content_bn} onChange={(e) => setForm({ ...form, content_bn: e.target.value })} className={adminInput} />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors ${form.published ? 'bg-secondary' : 'bg-[#262E44]'} relative`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.published ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="sr-only" />
            <span className="text-sm text-[rgba(255,255,255,0.82)]">{form.published ? 'Published' : 'Draft'}</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Post'}
            </button>
            <button type="button" onClick={() => setShowEditor(false)} className="px-6 py-2.5 bg-[#262E44] text-[rgba(255,255,255,0.82)] font-semibold rounded-xl hover:bg-[rgba(15,23,42,0.65)] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors text-sm">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>
      <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[rgba(255,255,255,0.65)] text-sm">Loading...</div>
        ) : (
          <div className="divide-y divide-[rgba(255,255,255,0.10)]">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-white text-sm truncate">{post.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.published ? 'bg-accent/10 text-accent' : 'bg-[rgba(15,23,42,0.55)]/10 text-[rgba(255,255,255,0.65)]'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.65)]">{post.category} · {post.author} · {formatDate(post.created_at)}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => togglePublish(post)} className="p-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:bg-[#262E44] hover:text-white transition-colors" title={post.published ? 'Unpublish' : 'Publish'}>
                    {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(post)} className="p-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:bg-[#262E44] hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg text-[rgba(255,255,255,0.65)] hover:bg-gold/10 hover:text-gold transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <div className="p-10 text-center text-[rgba(255,255,255,0.65)] text-sm">No posts yet.</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-[rgba(255,255,255,0.65)]">{label}</label>
      {children}
    </div>
  )
}

const adminInput = 'w-full px-4 py-2.5 bg-primary border border-[rgba(255,255,255,0.12)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary placeholder-[rgba(255,255,255,0.40)] resize-none'
