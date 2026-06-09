import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { invalidateSiteSettings } from '@/lib/site-settings'

/**
 * Admin-only site_settings editor backend.
 *
 *   GET  /api/admin/settings       — returns all key/value rows
 *   POST /api/admin/settings       — accepts { settings: Record<string,string> }
 *                                    upserts each row, then invalidates the
 *                                    server cache so the public site picks up
 *                                    changes without a restart.
 */

interface SaveBody {
  settings: Record<string, string>
}

export async function GET(): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, description, group_name')
      .order('group_name', { ascending: true })
      .order('key',         { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed_to_load'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    const body = (await request.json()) as Partial<SaveBody>
    const settings = body.settings ?? {}
    const entries = Object.entries(settings).filter(([k]) => typeof k === 'string' && k.length > 0)

    if (entries.length === 0) {
      return NextResponse.json({ success: false, error: 'no_settings_provided' }, { status: 400 })
    }

    const supabase = createClient()
    // Upsert one row per key — preserves description + group_name on existing rows
    for (const [key, value] of entries) {
      if (typeof value !== 'string') continue
      if (value.length > 4000) {
        return NextResponse.json(
          { success: false, error: 'value_too_long', key },
          { status: 400 },
        )
      }
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key)
      if (error) {
        // If row doesn't exist yet (a brand-new key), upsert it
        const { error: upsertErr } = await supabase
          .from('site_settings')
          .upsert({ key, value, group_name: keyGroup(key) }, { onConflict: 'key' })
        if (upsertErr) throw upsertErr
      }
    }

    // Bust the next/cache tag so getSiteSettings() rebuilds on next request
    invalidateSiteSettings()

    return NextResponse.json({ success: true, count: entries.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'save_failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

function keyGroup(key: string): string {
  const prefix = key.split('.')[0]
  return ['company','contact','social','payments','media','hours','footer','seo','maps','general'].includes(prefix)
    ? prefix
    : 'general'
}

export const dynamic = 'force-dynamic'
