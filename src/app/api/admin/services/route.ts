import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}

export async function PUT(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { id, ...patch } = body
    if (!id) return NextResponse.json({ success: false, error: 'missing_id' }, { status: 400 })
    // Drop any read-only keys
    delete patch.created_at
    delete patch.updated_at

    const supabase = createClient()
    const { error } = await supabase.from('services').update(patch).eq('id', id)
    if (error) throw error

    revalidatePath('/[lang]/services',         'page')
    revalidatePath('/[lang]/services/[slug]',  'page')
    revalidatePath('/[lang]',                  'page') // home services bento
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
