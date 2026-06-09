import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Anonymous customers upload a payment receipt screenshot through this route.
 * The server uses the service-role client so we don't expose anon storage policies
 * beyond their bucket policy, and we control naming + content-type validation.
 *
 * Expects multipart/form-data with a single `file` field. Returns the public URL
 * the customer's submission can attach as `screenshot_url`.
 */
const MAX_BYTES   = 5 * 1024 * 1024            // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'])

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File too large (max 5 MB)' }, { status: 400 })
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Only JPG, PNG, WebP or PDF allowed' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext) ? ext : 'bin'
    const filename = `payments/${crypto.randomUUID()}.${safeExt}`

    const supabase = createClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadErr } = await supabase
      .storage
      .from('media')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert:       false,
      })

    if (uploadErr) {
      return NextResponse.json({ success: false, error: uploadErr.message }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from('media').getPublicUrl(filename)
    return NextResponse.json({ success: true, data: { url: pub.publicUrl, path: filename } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// Tell Next this route should not be statically prerendered
export const dynamic = 'force-dynamic'
