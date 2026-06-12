'use client'

import { useState, useEffect, Suspense, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { Orb } from '@/components/ui/Orb'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'auth-code-error') {
      // Use a microtask or next tick if absolutely necessary, 
      // but here it's fine to just set it once on mount if we're careful.
      // Better yet, just initialize the state if we can.
      setError('The authentication link is invalid or has expired.')
    }
  }, [searchParams])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
      } else {
        window.location.href = '/teacher/dashboard'
      }
    } catch {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/teacher/dashboard`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <GlassCard className="max-w-md w-full p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-700">
      <div className="flex flex-col items-center mb-10">
        <Orb size="md" className="mb-6 shadow-[0_0_20px_rgba(232,155,108,0.3)]" />
        <h1 className="text-3xl font-normal text-charcoal text-center">Teacher Login</h1>
        <p className="text-warm-grey text-base mt-2 text-center font-light">
          Continue your literary journey.
        </p>
      </div>

      {error && (
        <div className="bg-red-50/30 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-8 flex items-start gap-3 font-medium">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-charcoal/60 px-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal placeholder:text-warm-grey/30"
            placeholder="you@school.edu"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-charcoal/60 px-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal placeholder:text-warm-grey/30"
            placeholder="••••••••"
            required
          />
        </div>

        <PillButton
          type="submit"
          disabled={loading}
          className="w-full py-4 text-lg mt-4"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sign In'}
        </PillButton>
      </form>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-charcoal/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#FDFBF7] px-4 text-warm-grey/40 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        <GoogleButton onClick={handleGoogleLogin} />
      </div>

      <p className="text-center mt-10 text-base text-warm-grey font-light">
        Don&apos;t have an account?{' '}
        <Link href="/teacher/signup" className="text-terracotta font-medium hover:underline">
          Sign up
        </Link>
      </p>

      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-grey/40 hover:text-charcoal transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to landing page
        </Link>
      </div>
    </GlassCard>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
