import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(3),
  title_bn: z.string().optional(),
  excerpt: z.string().min(10),
  excerpt_bn: z.string().optional(),
  content: z.string().min(20),
  content_bn: z.string().optional(),
  cover_image: z.string().optional(),
  category: z.string().min(1),
  author: z.string().min(1),
  published: z.boolean().default(false),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const supabase = createClient()
    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (error) throw error
    return NextResponse.json({ success: true, data, meta: { total: count ?? 0, page, limit } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const supabase = createClient()
    const { error } = await supabase.from('blog_posts').insert({ ...data, slug: slugify(data.title) })
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? err.message : 'Failed to create post'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
