import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { createGuestSession, clearGuestSession } from '@/lib/auth/guest'

export async function POST(request: NextRequest) {
  try {
    const { classId, displayName } = await request.json()

    if (!classId || !displayName?.trim()) {
      return NextResponse.json({ error: 'Missing classId or displayName' }, { status: 400 })
    }

    // Verify class exists and allows guests
    const { data: cls, error: clsError } = await supabase
      .from('classes')
      .select('id, allow_guests')
      .eq('id', classId)
      .single()

    if (clsError || !cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (!cls.allow_guests) {
      return NextResponse.json({ error: 'This class does not allow guest access' }, { status: 403 })
    }

    // Create guest session row (public INSERT policy allows this with anon key)
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({ class_id: classId, display_name: displayName.trim() })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('guest_sessions insert error:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    await createGuestSession(session.id, classId)
    return NextResponse.json({ success: true, guestId: session.id })
  } catch (err) {
    console.error('guest auth error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  await clearGuestSession()
  return NextResponse.json({ success: true })
}
