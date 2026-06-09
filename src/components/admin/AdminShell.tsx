'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import AdminSidebar from './AdminSidebar'

interface AdminShellProps {
  children: React.ReactNode
}

/**
 * Admin chrome — sidebar + sticky header + content.
 *
 *   Layout philosophy (no dead-space, no stretched panels):
 *   - The root container is `min-h-screen` with the page background.
 *     This guarantees the navy bg covers the viewport even when content
 *     is short, so there's never a separate visible "empty panel" below.
 *   - The desktop sidebar is `fixed` to the left edge — taken out of
 *     normal flow so it can't force the main column to be 100vh tall.
 *   - The main column simply offsets `lg:ml-60` to clear the fixed
 *     sidebar. It has NO forced height. Short pages end with the page
 *     bg filling the remaining viewport; long pages scroll the document.
 *   - The header is `sticky top-0` inside the main column.
 *   - Mobile: drawer overlay + body-scroll-lock while open.
 */
const PAGE_TITLES: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/inquiries':    'Inquiries',
  '/admin/payments':     'Payments',
  '/admin/chat':         'Live Chat',
  '/admin/blog':         'Blog',
  '/admin/gallery':      'Gallery',
  '/admin/careers':      'Careers',
  '/admin/study-abroad': 'Study Abroad',
  '/admin/content':      'Home Content',
  '/admin/services':     'Services',
  '/admin/testimonials': 'Testimonials',
  '/admin/about':        'About Page',
  '/admin/seo':          'Page SEO',
  '/admin/analytics':    'Analytics',
  '/admin/settings':     'Settings',
}

const SIDEBAR_WIDTH = 'lg:ml-60'

export default function AdminShell({ children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close drawer whenever route changes
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [drawerOpen])

  const title =
    PAGE_TITLES[pathname] ??
    (Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k + '/') && k !== '/admin')?.[1] ?? 'Admin')

  return (
    <div className="min-h-screen bg-[#060B17]">
      {/* Desktop sidebar — fixed, out of flow */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-60 z-30">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer + scrim */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fade-in_160ms_ease-out_both]"
            aria-hidden="true"
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 animate-[drawer-in_220ms_ease-out_both]">
            <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* Main column — offset to clear the fixed sidebar. No forced height. */}
      <div className={`flex flex-col min-w-0 ${SIDEBAR_WIDTH}`}>
        {/* Sticky top header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 sm:px-6 border-b border-[rgba(255,255,255,0.08)] bg-primary/85 backdrop-blur-md">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-[rgba(255,255,255,0.78)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-white text-base tracking-tight truncate">{title}</h1>
        </header>

        {/* Content — sizes to its children. Padded. No min-height. */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
