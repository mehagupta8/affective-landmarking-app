import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getGuestSession } from '@/lib/auth/guest'

export async function GET() {
  const session = await getGuestSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: guest, error } = await supabase
    .from('guest_sessions')
    .select('*')
    .eq('id', session.guestId)
    .single()

  if (error || !guest) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(guest)
}
