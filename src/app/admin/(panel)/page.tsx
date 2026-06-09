import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, CreditCard, FileText, MessageCircle, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Inquiry, PaymentSubmission } from '@/types'

// ── Types ───────────────────────────────────────────────────────────────
interface DashboardStats {
  totalInquiries:  number
  newInquiries:    number
  totalPayments:   number
  pendingPayments: number
  openChats:       number
  publishedPosts:  number
}

// ── Data fetchers ───────────────────────────────────────────────────────
async function getStats(): Promise<DashboardStats> {
  try {
    const supabase = createClient()
    const head = { count: 'exact' as const, head: true }
    const [
      { count: totalInquiries  },
      { count: newInquiries    },
      { count: totalPayments   },
      { count: pendingPayments },
      { count: openChats       },
      { count: publishedPosts  },
    ] = await Promise.all([
      supabase.from('inquiries').select('*', head),
      supabase.from('inquiries').select('*', head).eq('status', 'new'),
      supabase.from('payment_submissions').select('*', head),
      supabase.from('payment_submissions').select('*', head).eq('status', 'pending'),
      supabase.from('chat_sessions').select('*', head).eq('status', 'open'),
      supabase.from('blog_posts').select('*', head).eq('published', true),
    ])
    return {
      totalInquiries:  totalInquiries  ?? 0,
      newInquiries:    newInquiries    ?? 0,
      totalPayments:   totalPayments   ?? 0,
      pendingPayments: pendingPayments ?? 0,
      openChats:       openChats       ?? 0,
      publishedPosts:  publishedPosts  ?? 0,
    }
  } catch {
    return { totalInquiries: 0, newInquiries: 0, totalPayments: 0, pendingPayments: 0, openChats: 0, publishedPosts: 0 }
  }
}

async function getRecentInquiries(): Promise<Inquiry[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    return (data ?? []) as Inquiry[]
  } catch { return [] }
}

async function getPendingPayments(): Promise<PaymentSubmission[]> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
    return (data ?? []) as PaymentSubmission[]
  } catch { return [] }
}

// ── Status colors (brand palette only) ──────────────────────────────────
const inquiryStatusColor: Record<string, string> = {
  new:         'bg-secondary/15 text-secondary border border-secondary/30',
  in_progress: 'bg-gold/15 text-gold border border-gold/30',
  resolved:    'bg-accent/15 text-accent border border-accent/30',
  closed:      'bg-white/8 text-[rgba(255,255,255,0.65)] border border-white/10',
}

const methodColor: Record<string, string> = {
  bkash: 'text-secondary',
  nagad: 'text-gold',
  bank:  'text-accent',
}

// ── Page ────────────────────────────────────────────────────────────────
export default async function AdminDashboardPage() {
  const [stats, recentInquiries, pendingPayments] = await Promise.all([
    getStats(),
    getRecentInquiries(),
    getPendingPayments(),
  ])

  const statCards = [
    {
      label:     'Inquiries',
      value:     stats.totalInquiries,
      sub:       `${stats.newInquiries} new`,
      icon:      MessageSquare,
      iconBg:    'bg-secondary/15 text-secondary',
      href:      '/admin/inquiries',
      attention: stats.newInquiries > 0,
    },
    {
      label:     'Payments',
      value:     stats.totalPayments,
      sub:       `${stats.pendingPayments} pending`,
      icon:      CreditCard,
      iconBg:    'bg-gold/15 text-gold',
      href:      '/admin/payments?status=pending',
      attention: stats.pendingPayments > 0,
    },
    {
      label:     'Open chats',
      value:     stats.openChats,
      sub:       stats.openChats > 0 ? 'Waiting for reply' : 'All caught up',
      icon:      MessageCircle,
      iconBg:    'bg-accent/15 text-accent',
      href:      '/admin/chat',
      attention: stats.openChats > 0,
    },
    {
      label:     'Blog posts',
      value:     stats.publishedPosts,
      sub:       'Published',
      icon:      FileText,
      iconBg:    'bg-secondary/15 text-secondary',
      href:      '/admin/blog',
      attention: false,
    },
  ]

  return (
    <div className="max-w-7xl">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Welcome back, Admin</h1>
        <p className="text-[rgba(255,255,255,0.65)] text-sm mt-1">Here&apos;s what&apos;s happening across your site today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative flex flex-col gap-3 bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl p-4 sm:p-5 hover:border-[rgba(255,255,255,0.20)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <card.icon className="w-4 h-4" />
              </div>
              {card.attention && (
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" aria-label="Needs attention" />
              )}
            </div>
            <div>
              <div className="text-3xl font-display font-extrabold text-white tracking-tight leading-none">
                {card.value}
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.65)] mt-2 font-medium">
                {card.label} <span className="text-[rgba(255,255,255,0.45)]">· {card.sub}</span>
              </div>
            </div>
            <ArrowUpRight className="absolute top-4 right-4 w-3.5 h-3.5 text-[rgba(255,255,255,0.30)] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Two-column lists */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent inquiries */}
        <section className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-secondary" />
              Recent inquiries
            </h2>
            <Link href="/admin/inquiries" className="text-xs font-semibold text-secondary hover:text-white transition-colors flex items-center gap-1">
              View all
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </header>
          {recentInquiries.length === 0 ? (
            <div className="px-5 py-12 text-center text-[rgba(255,255,255,0.55)] text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No inquiries yet
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
              {recentInquiries.map((inq) => (
                <li key={inq.id}>
                  <Link
                    href="/admin/inquiries"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {inq.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{inq.name}</div>
                      <div className="text-xs text-[rgba(255,255,255,0.55)] truncate">
                        {inq.service} · {formatDate(inq.created_at, 'dd MMM, HH:mm')}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${inquiryStatusColor[inq.status] ?? inquiryStatusColor.closed}`}>
                      {inq.status?.replace('_', ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pending payments */}
        <section className="bg-[#1A2236] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold" />
              Pending payments
            </h2>
            <Link href="/admin/payments?status=pending" className="text-xs font-semibold text-gold hover:text-white transition-colors flex items-center gap-1">
              Review all
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </header>
          {pendingPayments.length === 0 ? (
            <div className="px-5 py-12 text-center text-[rgba(255,255,255,0.55)] text-sm">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No pending payments
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
              {pendingPayments.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/admin/payments?status=pending"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm truncate">{p.amount}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${methodColor[p.payment_method] ?? ''}`}>
                          {p.payment_method}
                        </span>
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.55)] truncate font-mono">
                        TX · {p.transaction_id} · {formatDate(p.created_at, 'dd MMM')}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[rgba(255,255,255,0.40)] shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
