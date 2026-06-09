import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  title_bn: z.string().optional(),
  image_url: z.string().url(),
  category: z.string().min(1),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('gallery_items').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch gallery' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const supabase = createClient()
    const { error } = await supabase.from('gallery_items').insert(data)
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message ?? err.message : 'Failed to add gallery item'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const supabase = createClient()
    const { error } = await supabase.from('gallery_items').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 })
  }
}
