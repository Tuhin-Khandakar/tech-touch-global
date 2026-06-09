import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthed } from '@/lib/admin-auth'

/**
 * Generic admin-only media upload.
 *
 * Usage (multipart/form-data):
 *   POST /api/uploads/media
 *     file:    <File>           — required
 *     folder:  'settings'       — optional; one of the allowed folders below
 *
 * Returns { success, data: { url, path } }.
 *
 * Auth: requires a valid admin_token cookie. Anonymous uploads have their
 * own narrower route at /api/uploads/payment (folder fixed to 'payments').
 */
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'image/svg+xml', 'image/avif', 'image/x-icon',
])

// Whitelist of writable folders. Anything else is rejected so a misuse can't
// clobber the 'payments' folder or write to a sibling bucket path.
const ALLOWED_FOLDERS: ReadonlySet<string> = new Set([
  'settings',     // logos, favicons, OG images
  'blog',         // blog post covers + in-body images
  'gallery',      // gallery photos
  'countries',    // study-abroad cover images
  'services',     // service category illustrations
  'team',         // team/about page photos
  'testimonials', // avatar uploads
  'about',        // about page imagery
])

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':   return 'jpg'
    case 'image/png':   return 'png'
    case 'image/webp':  return 'webp'
    case 'image/gif':   return 'gif'
    case 'image/svg+xml': return 'svg'
    case 'image/avif':  return 'avif'
    case 'image/x-icon': return 'ico'
    default:            return 'bin'
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const file = form.get('file')
    const folderRaw = form.get('folder')
    const folder = typeof folderRaw === 'string' ? folderRaw : 'settings'

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'no_file' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'file_too_large' }, { status: 400 })
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ success: false, error: 'invalid_mime' }, { status: 400 })
    }
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ success: false, error: 'invalid_folder' }, { status: 400 })
    }

    const ext = extFromMime(file.type)
    const path = `${folder}/${crypto.randomUUID()}.${ext}`

    const supabase = createClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabase
      .storage
      .from('media')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })
    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
    return NextResponse.json({ success: true, data: { url: pub.publicUrl, path } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upload_failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
