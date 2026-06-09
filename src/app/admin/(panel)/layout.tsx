import { requireAdmin } from '@/lib/admin-auth'
import AdminShell from '@/components/admin/AdminShell'

/**
 * Auth-guarded admin layout.
 *
 * This layout wraps EVERY page inside the (panel) route group — all the
 * dashboard, inquiries, payments, etc. The route group `(panel)` doesn't
 * appear in URLs, so /admin still resolves to (panel)/page.tsx,
 * /admin/inquiries to (panel)/inquiries/page.tsx, and so on.
 *
 * The login page (app/admin/login/page.tsx) sits OUTSIDE this group, so
 * `requireAdmin()` never fires on /admin/login. No more redirect loop.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // Throws redirect('/admin/login') if no valid admin_token cookie.
  await requireAdmin()
  return <AdminShell>{children}</AdminShell>
}
