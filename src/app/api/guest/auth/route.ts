import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createGuestSession, clearGuestSession } from '@/lib/auth/guest'

function serverClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async getAll() { return (await cookieStore).getAll() },
        async setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.then(s => s.set(name, value, options))) }
      }
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { classId, displayName } = await request.json()

    if (!classId || !displayName?.trim()) {
      return NextResponse.json({ error: 'Missing classId or displayName' }, { status: 400 })
    }

    const supabase = serverClient()

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

    // Create guest session row
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({ class_id: classId, display_name: displayName.trim() })
      .select('id')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    await createGuestSession(session.id, classId)
    return NextResponse.json({ success: true, guestId: session.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  await clearGuestSession()
  return NextResponse.json({ success: true })
}
