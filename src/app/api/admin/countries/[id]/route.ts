import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

interface Ctx { params: Promise<{ id: string }> }

const updateSchema = z.object({
  slug:               z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  name:               z.string().min(1).max(120).optional(),
  name_bn:            z.string().max(120).optional(),
  flag_emoji:         z.string().max(8).optional(),
  image_url:          z.string().max(500).optional(),
  description:        z.string().max(2000).optional(),
  description_bn:     z.string().max(2000).optional(),
  tuition_range:      z.string().max(120).optional(),
  scholarship_info:   z.string().max(2000).optional(),
  visa_process:       z.string().max(2000).optional(),
  intake_dates:       z.string().max(500).optional(),
  job_opportunities:  z.string().max(2000).optional(),
  top_universities:   z.array(z.string().max(200)).max(50).optional(),
  display_order:      z.number().int().optional(),
  published:          z.boolean().optional(),
})

export async function GET(_req: Request, { params }: Ctx): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const supabase = createClient()
    const { data, error } = await supabase
      .from('study_countries')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 })
  }
}

export async function PUT(request: Request, { params }: Ctx): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = await request.json()
    if (body.slug) body.slug = slugify(body.slug)
    const data = updateSchema.parse(body)

    const supabase = createClient()

    // Slug uniqueness across other rows
    if (data.slug) {
      const { data: existing } = await supabase
        .from('study_countries')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ success: false, error: 'slug_taken' }, { status: 409 })
      }
    }

    const { error } = await supabase
      .from('study_countries')
      .update(data)
      .eq('id', id)
    if (error) throw error

    revalidatePath('/[lang]/study-abroad', 'page')
    revalidatePath('/[lang]/study-abroad/[country]', 'page')

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.issues[0]?.message ?? 'validation' }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Ctx): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const supabase = createClient()
    const { error } = await supabase.from('study_countries').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/[lang]/study-abroad', 'page')
    revalidatePath('/[lang]/study-abroad/[country]', 'page')

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
