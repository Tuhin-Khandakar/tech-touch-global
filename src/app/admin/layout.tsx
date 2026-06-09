import type { Metadata } from 'next'

/**
 * Root admin layout — INTENTIONALLY minimal.
 *
 * This layer wraps BOTH the login page (`/admin/login`) AND the protected
 * panel (`/admin/(panel)/*`). It must therefore not call `requireAdmin()`,
 * not render the admin chrome (sidebar/header), and not redirect — otherwise
 * an unauthenticated visitor hitting `/admin/login` would be redirected to
 * `/admin/login` in an infinite loop.
 *
 * The auth-guarded UI lives in app/admin/(panel)/layout.tsx.
 */
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin — Tech Touch Global' },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
