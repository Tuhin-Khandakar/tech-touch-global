/**
 * Server-side Google reCAPTCHA v3 token verification.
 *
 * Usage from a route handler:
 *
 *   import { verifyRecaptcha } from '@/lib/recaptcha'
 *
 *   const v = await verifyRecaptcha({
 *     token:    body.recaptcha_token,
 *     action:   'inquiry',
 *     remoteIp: request.headers.get('x-forwarded-for') ?? undefined,
 *   })
 *   if (!v.ok) return NextResponse.json({ success: false, error: 'captcha_failed' }, { status: 400 })
 *
 * The verifier:
 *   - POSTs to Google's siteverify endpoint
 *   - rejects if the response is not `success`
 *   - rejects if the action name does not match what the client claimed
 *   - rejects if the score is below RECAPTCHA_MIN_SCORE (default 0.5)
 *
 * If RECAPTCHA_SECRET_KEY is not configured we return `ok: true` with a
 * `skipped` flag so local development without keys keeps working — the
 * production env must have the secret set.
 */

interface VerifyOptions {
  token:    string
  action:   string
  remoteIp?: string
  /** Minimum score (0.0 – 1.0). Defaults to RECAPTCHA_MIN_SCORE env var or 0.5. */
  threshold?: number
}

export interface RecaptchaVerifyResult {
  ok:       boolean
  score?:   number
  action?:  string
  errors?:  string[]
  /** True when verification was skipped because no secret is configured. */
  skipped?: boolean
}

interface GoogleVerifyResponse {
  success:        boolean
  score?:         number
  action?:        string
  challenge_ts?:  string
  hostname?:      string
  'error-codes'?: string[]
}

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const DEFAULT_THRESHOLD = 0.5

export async function verifyRecaptcha({
  token,
  action,
  remoteIp,
  threshold,
}: VerifyOptions): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) {
    // Dev/preview without keys — let traffic through but flag it
    return { ok: true, skipped: true }
  }

  // ── Skip verification in local development ──
  // The reCAPTCHA site key is registered for the production domain
  // (techtouchglobal.com). Tokens issued on `localhost` get rejected by
  // Google's siteverify, which would block admin login and form submissions
  // during development. We deliberately bypass the check when NODE_ENV is
  // 'development' so devs can work without registering localhost in the
  // Google admin console. Production builds (NODE_ENV='production') still
  // enforce the full check.
  //
  // An explicit RECAPTCHA_FORCE_VERIFY=1 in .env.local re-enables the
  // check in dev if you want to test the real flow against a localhost-
  // registered key.
  if (process.env.NODE_ENV !== 'production' && process.env.RECAPTCHA_FORCE_VERIFY !== '1') {
    return { ok: true, skipped: true, score: 0.9 }
  }

  if (!token) {
    return { ok: false, errors: ['missing_token'] }
  }

  const min = threshold ?? parseFloat(process.env.RECAPTCHA_MIN_SCORE ?? String(DEFAULT_THRESHOLD))

  const form = new URLSearchParams()
  form.set('secret',   secret)
  form.set('response', token)
  if (remoteIp) form.set('remoteip', remoteIp)

  let data: GoogleVerifyResponse
  try {
    const res = await fetch(VERIFY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    form.toString(),
      // Tight timeout — Google is usually <300ms; cap to avoid hanging the form
      signal: AbortSignal.timeout(5000),
    })
    data = (await res.json()) as GoogleVerifyResponse
  } catch {
    return { ok: false, errors: ['network_error'] }
  }

  if (!data.success) {
    return {
      ok:     false,
      score:  data.score,
      action: data.action,
      errors: data['error-codes'] ?? ['google_rejected'],
    }
  }
  if (data.action && data.action !== action) {
    return {
      ok:     false,
      score:  data.score,
      action: data.action,
      errors: ['action_mismatch'],
    }
  }
  if ((data.score ?? 0) < min) {
    return {
      ok:     false,
      score:  data.score,
      action: data.action,
      errors: ['low_score'],
    }
  }

  return { ok: true, score: data.score, action: data.action }
}

/**
 * Small helper for route handlers: pulls the client IP from common headers
 * (Vercel sets x-forwarded-for; some hosts use cf-connecting-ip).
 */
export function clientIpFromRequest(request: Request): string | undefined {
  const h = request.headers
  return (
    h.get('cf-connecting-ip')   ??
    h.get('x-real-ip')          ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    undefined
  )
}
