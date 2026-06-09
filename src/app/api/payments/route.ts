import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyRecaptcha, clientIpFromRequest } from '@/lib/recaptcha'
import { z } from 'zod'

const schema = z.object({
  service:         z.string().min(1),
  payment_method:  z.enum(['bkash', 'nagad', 'bank']),
  transaction_id:  z.string().min(4),
  sender_number:   z.string().min(7),
  amount:          z.string().min(1),
  note:            z.string().optional(),
  inquiry_id:      z.string().optional(),
  payer_name:      z.string().optional(),
  payer_email:     z.string().email().optional().or(z.literal('')),
  screenshot_url:  z.string().url().optional().or(z.literal('')),
  recaptcha_token: z.string().optional().default(''),
})

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const captcha = await verifyRecaptcha({
      token:    data.recaptcha_token,
      action:   'payment',
      remoteIp: clientIpFromRequest(request),
    })
    if (!captcha.ok) {
      return NextResponse.json(
        { success: false, error: 'captcha_failed', details: captcha.errors },
        { status: 400 },
      )
    }

    const { recaptcha_token: _drop, ...payload } = data

    const supabase = createClient()
    const { error } = await supabase
      .from('payment_submissions')
      .insert({ ...payload, status: 'pending' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? err.message : 'Failed to submit payment'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const status = searchParams.get('status')

    const supabase = createClient()
    let query = supabase
      .from('payment_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw error
    return NextResponse.json({ success: true, data, meta: { total: count ?? 0, page, limit } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 })
  }
}
