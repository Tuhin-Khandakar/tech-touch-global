import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  id:        z.string().uuid().optional(),
  name:      z.string().min(1).max(120),
  name_bn:   z.string().max(120).optional().default(''),
  role:      z.string().max(160).optional().default(''),
  role_bn:   z.string().max(160).optional().default(''),
  content:   z.string().min(1).max(2000),
  content_bn:z.string().max(2000).optional().default(''),
  avatar:    z.string().max(500).optional().default(''),
  rating:    z.number().int().min(1).max(5).optional().default(5),
  service:   z.string().max(80).optional().default('general'),
  published: z.boolean().optional().default(true),
})

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at',    { ascending: false })
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
      const { error } = await supabase.from('testimonials').update(patch).eq('id', id)
      if (error) throw error
    } else {
      const { id: _drop, ...insert } = data
      const { error } = await supabase.from('testimonials').insert(insert)
      if (error) throw error
    }
    revalidatePath('/[lang]', 'page')
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
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/[lang]', 'page')
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
