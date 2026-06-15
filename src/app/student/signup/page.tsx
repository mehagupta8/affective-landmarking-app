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

export default function StudentSignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${firstName.trim()} ${lastName.trim()}`, role: 'student' },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/student/dashboard`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Block teachers from creating a student account
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (teacherProfile) {
        await supabase.auth.signOut()
        setError('This email belongs to a teacher account. Please use the teacher login page.')
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          id: data.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      router.push('/student/dashboard')
    }
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/student/dashboard`,
      },
    })
  }

  return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-6 md:p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <Orb size="md" className="mb-6 shadow-[0_0_20px_rgba(232,155,108,0.3)]" />
          <h1 className="text-3xl font-normal text-charcoal text-center">Create Student Account</h1>
          <p className="text-warm-grey text-base mt-2 text-center font-light">
            Join the emotional space of literature.
          </p>
        </div>

        {error && (
          <div className="bg-red-50/30 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-8 flex items-start gap-3 font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 px-2">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-5 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal placeholder:text-warm-grey/30"
                placeholder="Ada"
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 px-2">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-5 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal placeholder:text-warm-grey/30"
                placeholder="Lovelace"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

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
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-charcoal/60 px-2">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal placeholder:text-warm-grey/30"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <PillButton type="submit" disabled={loading} className="w-full py-4 text-lg mt-2">
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Create Account'}
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
          <GoogleButton label="Sign up with Google" onClick={handleGoogleSignup} />
        </div>

        <p className="text-center mt-8 text-base text-warm-grey font-light">
          Already have an account?{' '}
          <Link href="/student/login" className="text-terracotta font-medium hover:underline">
            Sign in
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
