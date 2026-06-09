import { redirect } from 'next/navigation'
import { isAdminAuthed } from '@/lib/admin-auth'
import LoginForm from './LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
}

/**
 * /admin/login — public entry point for the admin panel.
 *
 * Server-side check: if the user already has a valid admin token, hop
 * straight to the dashboard instead of showing the form. Otherwise render
 * the LoginForm Client Component.
 *
 * This route lives OUTSIDE the (panel) route group, so it does NOT inherit
 * the auth-guarded layout — visitors without a token can render it without
 * triggering a redirect loop.
 */
export default async function AdminLoginPage() {
  if (await isAdminAuthed()) {
    redirect('/admin')
  }
  return <LoginForm />
}
