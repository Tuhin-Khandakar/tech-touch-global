import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    if (body.action === 'start') {
      const { name, email } = body
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({ visitor_name: name, visitor_email: email ?? '', status: 'open' })
        .select('id')
        .single()
      if (error) throw error

      // Auto-welcome message
      await supabase.from('chat_messages').insert({
        session_id: session.id,
        sender: 'admin',
        content: `Hi ${name}! 👋 Welcome to Tech Touch Global Services. How can we help you today?`,
      })

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      return NextResponse.json({ success: true, data: { sessionId: session.id, messages } })
    }

    if (body.action === 'message') {
      const { sessionId, content, sender } = body
      const { error } = await supabase.from('chat_messages').insert({ session_id: sessionId, sender, content })
      if (error) throw error

      if (sender === 'visitor') {
        await supabase.from('chat_sessions').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', sessionId)
      }

      return NextResponse.json({ success: true })
    }

    if (body.action === 'history') {
      const { sessionId } = body
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ success: false, error: 'Chat error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'open'
    const supabase = createClient()
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('status', status)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
