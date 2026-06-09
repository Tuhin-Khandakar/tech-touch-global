import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { invalidateHomeContent } from '@/lib/site-content'

interface UpdateBody {
  /** key -> { en, bn } */
  entries: Record<string, { en?: string; bn?: string }>
}

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value_en, value_bn, description, group_name, kind')
      .order('group_name', { ascending: true })
      .order('key',        { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  try {
    const body = (await request.json()) as Partial<UpdateBody>
    const entries = body.entries ?? {}
    const keys = Object.keys(entries)
    if (keys.length === 0) {
      return NextResponse.json({ success: false, error: 'no_entries' }, { status: 400 })
    }
    const supabase = createClient()
    let count = 0
    for (const key of keys) {
      const patch: Record<string, string> = {}
      if (typeof entries[key].en === 'string') patch.value_en = entries[key].en as string
      if (typeof entries[key].bn === 'string') patch.value_bn = entries[key].bn as string
      if (Object.keys(patch).length === 0) continue
      // Only update; if the key doesn't exist, the admin must seed it via SQL.
      const { error } = await supabase.from('site_content').update(patch).eq('key', key)
      if (error) throw error
      count++
    }
    invalidateHomeContent()
    return NextResponse.json({ success: true, count })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'failed' }, { status: 500 })
  }
}
