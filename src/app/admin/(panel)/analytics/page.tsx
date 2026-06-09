import { createClient } from '@/lib/supabase/server'

async function getData() {
  try {
    const supabase = createClient()
    const [
      { data: inquiries },
      { data: payments },
      { data: posts },
    ] = await Promise.all([
      supabase.from('inquiries').select('service, status, created_at'),
      supabase.from('payment_submissions').select('payment_method, status, amount, created_at'),
      supabase.from('blog_posts').select('category, published, created_at'),
    ])

    // Service breakdown
    const serviceCount: Record<string, number> = {}
    for (const inq of inquiries ?? []) {
      serviceCount[inq.service] = (serviceCount[inq.service] ?? 0) + 1
    }

    // Status breakdown
    const statusCount: Record<string, number> = {}
    for (const inq of inquiries ?? []) {
      statusCount[inq.status] = (statusCount[inq.status] ?? 0) + 1
    }

    // Payment method breakdown
    const methodCount: Record<string, number> = {}
    for (const p of payments ?? []) {
      methodCount[p.payment_method] = (methodCount[p.payment_method] ?? 0) + 1
    }

    return { inquiries: inquiries ?? [], payments: payments ?? [], posts: posts ?? [], serviceCount, statusCount, methodCount }
  } catch {
    return { inquiries: [], payments: [], posts: [], serviceCount: {}, statusCount: {}, methodCount: {} }
  }
}

export default async function AnalyticsPage() {
  const { inquiries, payments, serviceCount, statusCount, methodCount } = await getData()

  const confirmedPayments = payments.filter((p) => p.status === 'confirmed').length
  const pendingPayments = payments.filter((p) => p.status === 'pending').length

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Inquiries', value: inquiries.length, color: 'text-secondary' },
          { label: 'Total Payments', value: payments.length, color: 'text-accent' },
          { label: 'Confirmed Payments', value: confirmedPayments, color: 'text-accent' },
          { label: 'Pending Payments', value: pendingPayments, color: 'text-gold' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl p-5">
            <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-[rgba(255,255,255,0.65)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Service breakdown */}
        <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Inquiries by Service</h3>
          <div className="space-y-3">
            {Object.entries(serviceCount).sort(([, a], [, b]) => b - a).map(([service, count]) => (
              <div key={service}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[rgba(255,255,255,0.82)] capitalize">{service.replace('-', ' ')}</span>
                  <span className="text-[rgba(255,255,255,0.65)]">{count}</span>
                </div>
                <div className="h-1.5 bg-[#262E44] rounded-full">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${(count / Math.max(...Object.values(serviceCount))) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(serviceCount).length === 0 && <p className="text-[rgba(255,255,255,0.65)] text-xs">No data yet</p>}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Inquiry Status</h3>
          <div className="space-y-3">
            {Object.entries(statusCount).map(([status, count]) => {
              const colors: Record<string, string> = { new: 'bg-secondary', in_progress: 'bg-gold', resolved: 'bg-accent', closed: 'bg-[rgba(15,23,42,0.55)]' }
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[status] ?? 'bg-[rgba(15,23,42,0.55)]'}`} />
                  <span className="text-sm text-[rgba(255,255,255,0.82)] flex-1 capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              )
            })}
            {Object.keys(statusCount).length === 0 && <p className="text-[rgba(255,255,255,0.65)] text-xs">No data yet</p>}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.12)] rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 text-sm">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(methodCount).map(([method, count]) => {
              const colors: Record<string, string> = { bkash: 'bg-secondary', nagad: 'bg-gold', bank: 'bg-accent' }
              return (
                <div key={method} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[method] ?? 'bg-[rgba(15,23,42,0.55)]'}`} />
                  <span className="text-sm text-[rgba(255,255,255,0.82)] flex-1 capitalize">{method}</span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              )
            })}
            {Object.keys(methodCount).length === 0 && <p className="text-[rgba(255,255,255,0.65)] text-xs">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
