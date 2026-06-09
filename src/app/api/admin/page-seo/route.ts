import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { invalidatePageSeo } from '@/lib/page-seo'
import { z } from 'zod'

const schema = z.object({
  route:          z.string().min(1).max(120),
  title_en:       z.string().max(200).optional().default(''),
  title_bn:       z.string().max(200).optional().default(''),
  description_en: z.string().max(500).optional().default(''),
  description_bn: z.string().max(500).optional().default(''),
  og_image:       z.string().max(500).optional().default(''),
  noindex:        z.boolean().optional().default(false),
})

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('page_seo')
      .select('*')
      .order('route', { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const supabase = createClient()
    const { error } = await supabase.from('page_seo').upsert(data, { onConflict: 'route' })
    if (error) throw error
    invalidatePageSeo()
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message }, { status: 400 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const { route } = await request.json()
    if (!route) return NextResponse.json({ success: false, error: 'missing_route' }, { status: 400 })
    const supabase = createClient()
    const { error } = await supabase.from('page_seo').delete().eq('route', route)
    if (error) throw error
    invalidatePageSeo()
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
