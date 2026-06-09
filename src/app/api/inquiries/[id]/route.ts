import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteCtx {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createClient()
    const { error } = await supabase
      .from('inquiries')
      .update({ ...body })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update inquiry' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const supabase = createClient()
    const { error } = await supabase.from('inquiries').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete inquiry' }, { status: 500 })
  }
}
