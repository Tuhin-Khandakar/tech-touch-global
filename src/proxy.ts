import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Locale proxy.
 *
 * The public site lives under /[lang]. Visiting `/` or `/about` needs to be
 * rewritten to `/en/...` or `/bn/...`.
 *
 * The ADMIN PANEL is NOT localized — it lives at /admin only — so this proxy
 * must NEVER touch any /admin path. The matcher below excludes them entirely.
 * As a safety net the function body also short-circuits if it ever sees one
 * (defence in depth — e.g. if the matcher is widened by a future edit).
 *
 * It also strips legacy locale-prefixed admin URLs:
 *   /en/admin/login -> /admin/login   (so old bookmarks still work)
 *   /bn/admin       -> /admin
 */

const LOCALES: readonly string[] = ['en', 'bn']
const DEFAULT_LOCALE = 'en'

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (acceptLanguage.includes('bn')) return 'bn'
  return DEFAULT_LOCALE
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Defence-in-depth: never touch admin / api / infra / static ──────
  if (
    pathname === '/admin'         ||
    pathname.startsWith('/admin/')||
    pathname.startsWith('/api/')  ||
    pathname.startsWith('/_next/')||
    pathname.startsWith('/static/')||
    pathname.includes('.')           // any file with an extension
  ) {
    return NextResponse.next()
  }

  // ── 2. Strip legacy /en/admin/* and /bn/admin/* down to /admin/* ───────
  // Catches old links/bookmarks pointing at /en/admin/login etc.
  for (const locale of LOCALES) {
    if (pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`)) {
      const stripped = pathname.replace(`/${locale}`, '') || '/admin'
      request.nextUrl.pathname = stripped
      return NextResponse.redirect(request.nextUrl)
    }
  }

  // ── 3. Already locale-prefixed? Let it through ─────────────────────────
  const hasLocalePrefix = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  )
  if (hasLocalePrefix) return NextResponse.next()

  // ── 4. No locale prefix — prepend one and redirect ─────────────────────
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

/**
 * Matcher excludes:
 *   admin    — admin panel routes (handled at app/admin/* directly)
 *   api      — API route handlers
 *   _next    — Next.js internals (assets, RSC, image optimizer)
 *   static   — anything served from /public/static
 *   <file>.* — favicons, sitemap, opengraph images, logos, etc.
 */
export const config = {
  matcher: ['/((?!admin|api|_next|static|.*\\..*).*)'],
}
