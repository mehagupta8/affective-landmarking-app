'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ChevronLeft, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { Orb } from '@/components/ui/Orb'

export default function StudentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/student/dashboard')
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/student/dashboard`,
      },
    })
  }

  return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <Orb size="md" className="mb-6 shadow-[0_0_20px_rgba(232,155,108,0.3)]" />
          <h1 className="text-3xl font-normal text-charcoal text-center">Student Login</h1>
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
            <label className="block text-sm font-medium text-charcoal/60 px-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal placeholder:text-warm-grey/30"
              placeholder="you@school.edu"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-charcoal/60 px-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal placeholder:text-warm-grey/30"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <PillButton type="submit" disabled={loading} className="w-full py-4 text-lg">
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sign In'}
          </PillButton>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FDFBF7] px-4 text-warm-grey/40 font-bold tracking-widest">Or</span>
            </div>
          </div>
          <GoogleButton label="Sign in with Google" onClick={handleGoogleLogin} />
        </div>

        <p className="text-center mt-8 text-base text-warm-grey font-light">
          Don&apos;t have an account?{' '}
          <Link href="/student/signup" className="text-terracotta font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-grey/40 hover:text-charcoal transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
