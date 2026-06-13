'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
// ...
import { ArrowRight, Loader2, ChevronLeft } from 'lucide-react'
import { Class } from '@/types/database'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { Orb } from '@/components/ui/Orb'
import { InfoTabs } from '@/components/info/InfoTabs'
import Link from 'next/link'

type JoinStep = 'code' | 'identity'

export default function JoinPage() {
  const [step, setStep] = useState<JoinStep>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for step 'code'
  const [classCode, setClassCode] = useState('')
  const [foundClass, setFoundClass] = useState<Class | null>(null)
  
  // State for step 'identity'
  const [authAction, setAuthAction] = useState<'join' | 'login'>('login')
  const [studentName, setStudentName] = useState('')
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)

  const router = useRouter()

  useEffect(() => {
    // 1. Check for active Supabase session (Google Auth)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSupabaseUser(user)
        setStudentName(prev => prev || user.user_metadata?.full_name || '')
      }
    }
    void checkUser()

    // 2. Check if already has a student session
    const checkSession = async () => {
      const res = await fetch('/api/student/me')
      if (res.ok) {
        router.push('/student/dashboard')
      }
    }
    void checkSession()

    // 3. Handle redirect back from Google Auth
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && step === 'code') {
      setClassCode(code)
      void handleVerifyCodeAuto(code)
    }
  }, [router, step])

  const handleVerifyCodeAuto = async (code: string) => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', code.toUpperCase())
      .single()

    if (!fetchError && data) {
      setFoundClass(data)
      setStep('identity')
    }
    setLoading(false)
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', classCode.toUpperCase())
      .single()

    if (fetchError || !data) {
      setError('Invalid class code. Please check with your teacher.')
    } else {
      setFoundClass(data)
      setStep('identity')
    }
    setLoading(false)
  }

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!foundClass) return

    try {
      const response = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authAction,
          classId: foundClass.id,
          name: studentName.trim(),
          auth_user_id: supabaseUser?.id || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (authAction === 'login' && response.status === 404) {
          setError('No account found with that name. Try creating a new account instead.')
        } else {
          setError(result.error || 'Authentication failed.')
        }
        setLoading(false)
        return
      }

      router.push('/student/dashboard')
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen atmospheric-bg flex flex-col items-center justify-center p-6 py-20">
      <div className="max-w-4xl w-full">
        <InfoTabs 
          mainContent={
            <div className="flex flex-col items-center justify-center w-full">
              <GlassCard className="max-w-md w-full p-0 shadow-2xl border-white/40 overflow-hidden animate-in fade-in zoom-in duration-700">
                <div className="bg-white/40 backdrop-blur-md p-10 flex flex-col items-center border-b border-white/40">
                  <Orb size="md" className="mb-6 shadow-[0_0_20px_rgba(232,155,108,0.3)]" />
                  <h1 className="text-3xl font-normal text-charcoal">Join Class</h1>
                  <p className="text-warm-grey text-base mt-2 font-light">Enter the shared emotional space.</p>
                </div>

                <div className="p-10">
                  {error && (
                    <div className="bg-red-50/30 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-8 font-medium flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {step === 'code' && (
                    <form onSubmit={handleVerifyCode} className="space-y-8">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-charcoal/60 text-center uppercase tracking-[0.2em]">
                          Class Code
                        </label>
                        <input
                          type="text"
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value)}
                          className="w-full text-center text-4xl font-mono tracking-[0.4em] px-4 py-6 bg-white/30 border-none rounded-[28px] focus:ring-2 focus:ring-terracotta/20 outline-none transition-all uppercase placeholder:text-warm-grey/10 text-charcoal"
                          placeholder="------"
                          maxLength={6}
                          required
                        />
                      </div>

                      <PillButton
                        type="submit"
                        disabled={loading || classCode.length < 6}
                        className="w-full py-5 text-xl flex items-center justify-center gap-3"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Find Class'}
                        <ArrowRight className="w-6 h-6" />
                      </PillButton>

                      <div className="text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-grey/40 hover:text-charcoal transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                          Back
                        </Link>
                      </div>
                    </form>
                  )}

                  {step === 'identity' && foundClass && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex bg-white/30 p-1.5 rounded-full border border-white/40">
                        <button
                          onClick={() => setAuthAction('login')}
                          className={cn(
                            "flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
                            authAction === 'login' ? "bg-white text-charcoal shadow-sm" : "text-warm-grey/60 hover:text-charcoal"
                          )}
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => setAuthAction('join')}
                          className={cn(
                            "flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
                            authAction === 'join' ? "bg-white text-charcoal shadow-sm" : "text-warm-grey/60 hover:text-charcoal"
                          )}
                        >
                          New Account
                        </button>
                      </div>

                      <form onSubmit={handleAuth} className="space-y-6">
                        <div className="text-center mb-2">
                          <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest">
                            {authAction === 'login' ? 'Welcome Back to' : 'Creating Account for'}
                          </span>
                          <h2 className="text-2xl text-charcoal">{foundClass.name}</h2>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-charcoal/60 px-2">
                            {authAction === 'login' ? 'What\'s your name?' : 'Choose a display name'}
                          </label>
                          <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal text-lg"
                            placeholder="e.g. Jane Doe"
                            required
                          />
                        </div>

                        <PillButton
                          type="submit"
                          disabled={loading || !studentName.trim()}
                          className="w-full py-5 text-xl flex items-center justify-center gap-3"
                        >
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (authAction === 'login' ? 'Enter Space' : 'Create & Join')}
                          <ArrowRight className="w-6 h-6" />
                        </PillButton>

                        <div className="relative py-2">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-charcoal/5"></div>
                          </div>
                          <div className="relative flex justify-center text-[8px] uppercase">
                            <span className="bg-[#FDFBF7] px-4 text-warm-grey/40 font-bold tracking-[0.3em]">Secure Google Entry</span>
                          </div>
                        </div>

                        <GoogleButton 
                          label={authAction === 'login' ? 'Sign in with Google' : 'Sign up with Google'} 
                          onClick={() => {
                            supabase.auth.signInWithOAuth({
                              provider: 'google',
                              options: {
                                redirectTo: `${window.location.origin}/auth/callback?next=/join?code=${classCode}`,
                              },
                            })
                          }}
                        />
                      </form>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          } 
        />
      </div>
    </div>
  )
}
