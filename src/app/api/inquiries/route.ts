import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyRecaptcha, clientIpFromRequest } from '@/lib/recaptcha'
import { z } from 'zod'

const schema = z.object({
  name:    z.string().min(2),
  email:   z.string().email(),
  phone:   z.string().min(7),
  service: z.string().min(1),
  message: z.string().min(10),
  // Optional so an empty string in dev still validates. Required-in-prod via verifyRecaptcha().
  recaptcha_token: z.string().optional().default(''),
})

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    // Bot check (skipped automatically if RECAPTCHA_SECRET_KEY is unset)
    const captcha = await verifyRecaptcha({
      token:    data.recaptcha_token,
      action:   'inquiry',
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
    const { error } = await supabase.from('inquiries').insert({ ...payload, status: 'new' })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? err.message : 'Failed to submit inquiry'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page   = parseInt(searchParams.get('page')  ?? '1')
    const limit  = parseInt(searchParams.get('limit') ?? '20')
    const status = searchParams.get('status')

    const supabase = createClient()
    let query = supabase
      .from('inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw error
    return NextResponse.json({ success: true, data, meta: { total: count ?? 0, page, limit } })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}
