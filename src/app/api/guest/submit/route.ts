import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getGuestSession } from '@/lib/auth/guest'

export async function POST(request: NextRequest) {
  const session = await getGuestSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { textId } = await request.json()
  if (!textId) return NextResponse.json({ error: 'Missing textId' }, { status: 400 })

  const { data: guest, error: fetchError } = await supabase
    .from('guest_sessions')
    .select('submitted_texts')
    .eq('id', session.guestId)
    .single()

  if (fetchError || !guest) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const submitted = guest.submitted_texts || []
  if (!submitted.includes(textId)) {
    const { error } = await supabase
      .from('guest_sessions')
      .update({ submitted_texts: [...submitted, textId] })
      .eq('id', session.guestId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
