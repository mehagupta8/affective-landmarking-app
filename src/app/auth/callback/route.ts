import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/teacher/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/teacher/login?error=auth-code-error`)
  }

  // Build the redirect response up-front so Supabase's setAll writes Set-Cookie onto it.
  // In Next 15, cookies written via next/headers `cookies().set()` are not reliably
  // merged onto a manually-constructed NextResponse.redirect(), which previously left
  // users unauthenticated after OAuth and bounced them back to /teacher/login.
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const forwardedHost = request.headers.get('x-forwarded-host')
  const targetOrigin = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin
  const response = NextResponse.redirect(`${targetOrigin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data?.user) {
    return NextResponse.redirect(`${origin}/teacher/login?error=auth-code-error`)
  }

  return response
}
