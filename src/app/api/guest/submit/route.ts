import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getGuestSession } from '@/lib/auth/guest'

export async function POST(request: NextRequest) {
  const session = await getGuestSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { textId } = await request.json()
  if (!textId) return NextResponse.json({ error: 'Missing textId' }, { status: 400 })

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
      }
    }
  )

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
