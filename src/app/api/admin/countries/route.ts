import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const upsertSchema = z.object({
  slug:               z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name:               z.string().min(1).max(120),
  name_bn:            z.string().max(120).optional().default(''),
  flag_emoji:         z.string().max(8).optional().default('🌍'),
  image_url:          z.string().max(500).optional().default(''),
  description:        z.string().max(2000).optional().default(''),
  description_bn:     z.string().max(2000).optional().default(''),
  tuition_range:      z.string().max(120).optional().default(''),
  scholarship_info:   z.string().max(2000).optional().default(''),
  visa_process:       z.string().max(2000).optional().default(''),
  intake_dates:       z.string().max(500).optional().default(''),
  job_opportunities:  z.string().max(2000).optional().default(''),
  top_universities:   z.array(z.string().max(200)).max(50).optional().default([]),
  display_order:      z.number().int().optional().default(0),
  published:          z.boolean().optional().default(false),
})

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_countries')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name',         { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    if (body.slug) body.slug = slugify(body.slug)
    const data = upsertSchema.parse(body)

    const supabase = createClient()

    // Unique slug check
    const { data: existing } = await supabase
      .from('study_countries')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ success: false, error: 'slug_taken' }, { status: 409 })
    }

    const { data: row, error } = await supabase
      .from('study_countries')
      .insert(data)
      .select()
      .single()
    if (error) throw error

    // Make new country visible immediately on the public site
    revalidatePath('/[lang]/study-abroad', 'page')
    revalidatePath('/[lang]/study-abroad/[country]', 'page')

    return NextResponse.json({ success: true, data: row })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.issues[0]?.message ?? 'validation' }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
