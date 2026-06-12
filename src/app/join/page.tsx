'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, BookOpen, Lock, ChevronLeft } from 'lucide-react'
import { Class, Text, Annotation } from '@/types/database'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { Orb } from '@/components/ui/Orb'
import { InfoTabs } from '@/components/info/InfoTabs'
import Link from 'next/link'

type JoinStep = 'code' | 'identity' | 'select-text'

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
  const [pin, setPin] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  
  // State for step 'select-text'
  const [texts, setTexts] = useState<Text[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [submittedTexts, setSubmittedTexts] = useState<string[]>([])
  const [studentId, setStudentId] = useState<string | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<any>(null)

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

    // 2. Handle redirect back from Google Auth
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && step === 'code') {
      setClassCode(code)
      void handleVerifyCodeAuto(code)
    }
  }, [])

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
    if (!/^\d{4}$/.test(pin)) {
      setError('Please enter a valid 4-digit PIN.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const action = authAction

      const response = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          classId: foundClass.id,
          name: studentName.trim(),
          pin,
          auth_user_id: supabaseUser?.id || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (action === 'login' && response.status === 401) {
          const newAttempts = loginAttempts + 1
          setLoginAttempts(newAttempts)
          if (newAttempts >= 3) {
            setError('Forgot your PIN? Ask your teacher to reset it.')
          } else {
            setError('Incorrect PIN. Please try again.')
          }
        } else {
          setError(result.error || 'Authentication failed.')
        }
        setLoading(false)
        return
      }

      setStudentId(result.studentId)
      
      const { data: classTexts } = await supabase
        .from('texts')
        .select('*')
        .eq('class_id', foundClass.id)
        .order('created_at', { ascending: false })

      const { data: studentAnns } = await supabase
        .from('annotations')
        .select('*')
        .eq('student_id', result.studentId)

      const { data: currentStudent } = await supabase
        .from('students')
        .select('submitted_texts')
        .eq('id', result.studentId)
        .single()

      setTexts(classTexts || [])
      setAnnotations(studentAnns || [])
      setSubmittedTexts(currentStudent?.submitted_texts || [])
      setStep('select-text')
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (text: Text) => {
    if (!text || text.content.length === 0) return 0
    const textAnns = annotations.filter(a => a.text_id === text.id)
    const intervals = textAnns
      .map(a => [a.start_offset, a.end_offset])
      .sort((a, b) => a[0] - b[0])

    if (intervals.length === 0) return 0

    const merged = [[...intervals[0]]]
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1]
      const curr = intervals[i]
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1])
      } else {
        merged.push([...curr])
      }
    }

    const totalCovered = merged.reduce((acc, [start, end]) => acc + (end - start), 0)
    return Math.min(100, Math.round((totalCovered / text.content.length) * 100))
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

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-charcoal/60 px-2 flex items-center justify-between">
                            {authAction === 'login' ? 'Enter PIN' : 'Create 4-digit PIN'}
                            <Lock className="w-3.5 h-3.5 opacity-30" />
                          </label>
                          <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal text-center text-2xl tracking-[0.8em] placeholder:text-warm-grey/10"
                            placeholder="••••"
                            maxLength={4}
                            required
                          />
                          <p className="text-[10px] text-warm-grey/60 px-4 mt-1">
                            Remember this PIN — you&apos;ll need it every time you return.
                          </p>
                        </div>

                        <PillButton
                          type="submit"
                          disabled={loading || !studentName.trim() || pin.length < 4}
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

                  {step === 'select-text' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest">Identify Confirmed</span>
                        <h2 className="text-2xl text-charcoal mt-1">Pick a text to begin</h2>
                      </div>

                      <div className="space-y-3">
                        {texts.length === 0 ? (
                          <p className="text-center text-warm-grey py-10 opacity-60 font-light">No texts uploaded yet.</p>
                        ) : (
                          texts.map((text) => {
                            const progress = calculateProgress(text)
                            const isSubmitted = submittedTexts.includes(text.id)

                            return (
                              <div key={text.id} className="space-y-2">
                                <button
                                  onClick={() => router.push(`/annotate/${text.id}?student=${studentId}`)}
                                  className="w-full flex flex-col p-5 bg-white/20 hover:bg-white/50 border border-white/40 rounded-3xl transition-all group shadow-sm text-left relative overflow-hidden"
                                >
                                  {isSubmitted && (
                                    <div className="absolute top-0 right-0 bg-terracotta text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
                                      Submitted
                                    </div>
                                  )}
                                  <div className="flex items-center gap-5 mb-4">
                                    <div className="w-12 h-12 glass bg-white/80 rounded-2xl flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform">
                                      <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-lg text-charcoal block line-clamp-1">{text.title}</span>
                                      <div className="flex flex-wrap gap-2 items-center mt-1">
                                        <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest">{progress}% Completed</span>
                                        {text.due_date && (
                                          <span className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border",
                                            new Date(text.due_date) < new Date() 
                                              ? "bg-red-50 text-red-500 border-red-100" 
                                              : "bg-terracotta/5 text-terracotta/40 border-terracotta/10"
                                          )}>
                                            {new Date(text.due_date) < new Date() ? 'CLOSED' : `DUE: ${new Date(text.due_date).toLocaleDateString()}`}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-charcoal/5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-terracotta transition-all duration-1000 ease-out"
                                      style={{ width: `${progress}%`, opacity: 0.3 + (progress / 100) * 0.7 }}
                                    />
                                  </div>
                                </button>
                                
                                {isSubmitted && (
                                  <Link 
                                    href={`/annotate/${text.id}/spectrum?student=${studentId}`}
                                    className="block w-full text-center py-3 bg-charcoal/5 hover:bg-charcoal/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/60 transition-all border border-charcoal/5"
                                  >
                                    View Class Spectrum
                                  </Link>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
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
