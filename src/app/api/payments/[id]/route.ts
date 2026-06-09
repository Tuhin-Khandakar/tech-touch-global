import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteCtx {
  params: Promise<{ id: string }>
}

interface PaymentUpdate {
  status?: 'pending' | 'confirmed' | 'rejected'
  note?:   string
}

export async function PATCH(request: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const body = await request.json() as PaymentUpdate
    const update: PaymentUpdate = {}
    if (body.status !== undefined) update.status = body.status
    if (body.note   !== undefined) update.note   = body.note

    const supabase = createClient()
    const { error } = await supabase
      .from('payment_submissions')
      .update(update)
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const supabase = createClient()
    const { error } = await supabase.from('payment_submissions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete payment' }, { status: 500 })
  }
}
