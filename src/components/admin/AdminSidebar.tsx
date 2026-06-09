'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, MessageSquare, FileText, Image, CreditCard,
  MessageCircle, BarChart3, Settings, Users, Globe, LogOut,
  Briefcase, Star, Info, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/design/Logo'

const navItems = [
  { href: '/admin',              label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/admin/inquiries',    label: 'Inquiries',     icon: MessageSquare },
  { href: '/admin/payments',     label: 'Payments',      icon: CreditCard },
  { href: '/admin/chat',         label: 'Live Chat',     icon: MessageCircle },
  { href: '/admin/blog',         label: 'Blog',          icon: FileText },
  { href: '/admin/gallery',      label: 'Gallery',       icon: Image },
  { href: '/admin/content',      label: 'Home Content',  icon: Globe },
  { href: '/admin/services',     label: 'Services',      icon: Briefcase },
  { href: '/admin/study-abroad', label: 'Study Abroad',  icon: Globe },
  { href: '/admin/testimonials', label: 'Testimonials',  icon: Star },
  { href: '/admin/about',        label: 'About Page',    icon: Info },
  { href: '/admin/seo',          label: 'Page SEO',      icon: Search },
  { href: '/admin/careers',      label: 'Careers',       icon: Users },
  { href: '/admin/analytics',    label: 'Analytics',     icon: BarChart3 },
  { href: '/admin/settings',     label: 'Settings',      icon: Settings },
]

interface AdminSidebarProps {
  /** Called after the user clicks a nav link — used by the mobile drawer to close itself. */
  onNavigate?: () => void
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout(): Promise<void> {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <aside className="flex flex-col bg-primary border-r border-[rgba(255,255,255,0.08)] w-60 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.08)] shrink-0">
        <Logo size="md" onDark className="shrink-0" />
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[11px] text-[rgba(255,255,255,0.65)] font-semibold uppercase tracking-wider">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin'
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors group',
                active
                  ? 'bg-secondary text-white font-medium'
                  : 'text-[rgba(255,255,255,0.65)] hover:bg-[#1A2236] hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[rgba(255,255,255,0.65)] hover:bg-gold/10 hover:text-gold transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
