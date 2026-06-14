'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Loader2, ChevronLeft } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { Orb } from '@/components/ui/Orb'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    window.location.href = '/teacher/dashboard'
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
    <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-6 md:p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <Orb size="md" className="mb-6 shadow-[0_0_20px_rgba(232,155,108,0.3)]" />
          <h1 className="text-3xl font-normal text-charcoal text-center">Teacher Signup</h1>
          <p className="text-warm-grey text-base mt-2 text-center font-light">
            Begin your literary analysis journey.
          </p>
        </div>

        {error && (
          <div className="bg-red-50/30 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-8 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
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
              minLength={6}
            />
          </div>

          <PillButton
            type="submit"
            disabled={loading}
            className="w-full py-4 text-lg mt-4"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Create Account'}
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
          Already have an account?{' '}
          <Link href="/teacher/login" className="text-terracotta font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-grey/40 hover:text-charcoal transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to landing page
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
