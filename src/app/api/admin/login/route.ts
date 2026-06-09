import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { verifyRecaptcha, clientIpFromRequest } from '@/lib/recaptcha'

function signToken(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return hmac.digest('hex')
}

function constantTimeEqual(a: string, b: string): boolean {
  // timingSafeEqual throws if lengths differ; pad to avoid leaking length
  const A = Buffer.from(a)
  const B = Buffer.from(b)
  if (A.length !== B.length) return false
  return timingSafeEqual(A, B)
}

interface LoginBody {
  username:        string
  password:        string
  recaptcha_token?: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<LoginBody>
    const username = typeof body.username === 'string' ? body.username : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const recaptchaToken = typeof body.recaptcha_token === 'string' ? body.recaptcha_token : ''

    // Bot/abuse defence on the auth surface
    const captcha = await verifyRecaptcha({
      token:    recaptchaToken,
      action:   'admin_login',
      remoteIp: clientIpFromRequest(request),
    })
    if (!captcha.ok) {
      return NextResponse.json(
        { success: false, error: 'captcha_failed', details: captcha.errors },
        { status: 400 },
      )
    }

    const adminUser = process.env.ADMIN_USERNAME    ?? 'admin'
    const adminPass = process.env.ADMIN_PASSWORD    ?? ''
    const secret    = process.env.ADMIN_JWT_SECRET  ?? 'fallback_secret'

    if (!constantTimeEqual(username, adminUser) || !constantTimeEqual(password, adminPass)) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const payload   = `${username}:${Date.now()}`
    const signature = signToken(payload, secret)
    const token     = Buffer.from(`${payload}:${signature}`).toString('base64')

    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}
