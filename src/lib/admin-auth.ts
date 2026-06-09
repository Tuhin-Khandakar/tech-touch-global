import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verify a HMAC-SHA256 signed admin token issued by /api/admin/login.
 * Token format: base64(<username>:<issuedAtMs>:<hexSignature>).
 *
 * Returns true iff the signature matches the configured ADMIN_JWT_SECRET.
 */
function verifyToken(token: string, secret: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length < 3) return false
    const signature = parts.pop() as string
    const payload   = parts.join(':')
    const expected  = createHmac('sha256', secret).update(payload).digest('hex')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Returns true if the current request carries a valid admin_token cookie.
 * Does NOT redirect. Use this when you need to branch (e.g. on /admin/login).
 */
export async function isAdminAuthed(): Promise<boolean> {
  const secret = process.env.ADMIN_JWT_SECRET ?? ''
  if (!secret) return false
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false
  return verifyToken(token, secret)
}

/**
 * Server-side admin guard.
 * If the visitor is not authenticated, throws `redirect('/admin/login')`.
 *
 * IMPORTANT: only call this from layouts/pages INSIDE the (panel) route
 * group. Calling it from /admin/login would create a redirect loop.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login')
  }
}
