import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  id:             z.string().uuid().optional(),
  service_id:     z.string().uuid(),
  title_en:       z.string().min(1).max(120),
  title_bn:       z.string().max(120).optional().default(''),
  description_en: z.string().max(2000).optional().default(''),
  description_bn: z.string().max(2000).optional().default(''),
  icon_emoji:     z.string().max(8).optional().default('🔹'),
  display_order:  z.number().int().optional().default(0),
  published:      z.boolean().optional().default(true),
})

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('service_id')
    const supabase = createClient()
    let query = supabase.from('service_items').select('*').order('display_order', { ascending: true })
    if (serviceId) query = query.eq('service_id', serviceId)
    const { data, error } = await query
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
    if (data.id) {
      const { id, ...patch } = data
      const { error } = await supabase.from('service_items').update(patch).eq('id', id)
      if (error) throw error
    } else {
      const { id: _drop, ...insert } = data
      const { error } = await supabase.from('service_items').insert(insert)
      if (error) throw error
    }
    revalidatePath('/[lang]/services/[slug]', 'page')
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message }, { status: 400 })
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: 'missing_id' }, { status: 400 })
    const supabase = createClient()
    const { error } = await supabase.from('service_items').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/[lang]/services/[slug]', 'page')
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
