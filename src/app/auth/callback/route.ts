import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/teacher/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.user) {
      const isLocalEnv = process.env.NODE_ENV === 'development'
      let redirectUrl = next

      // If it's a teacher (not student flow) and they don't have a PIN,
      // we can optionally force them to the dashboard where the guard will catch them,
      // or we can be explicit. The user requested a setup flow.
      
      const isTeacherFlow = next.startsWith('/teacher')
      const hasPin = data.user.user_metadata?.pin

      if (isTeacherFlow && !hasPin) {
        // We could redirect to a specific setup page if we wanted, 
        // but the Dashboard is already guarded by TeacherPinGuard.
        // Let's keep it simple or redirect to dashboard.
      }

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      } 
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
      }
      
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/teacher/login?error=auth-code-error`)
}
