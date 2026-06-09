'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, BookOpen, Lock, ChevronLeft } from 'lucide-react'
import { Class, Text } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
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
  const [studentName, setStudentName] = useState('')
  const [pin, setPin] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  
  // State for step 'select-text'
  const [texts, setTexts] = useState<Text[]>([])
  const [studentId, setStudentId] = useState<string | null>(null)

  const router = useRouter()

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

    if (!foundClass) return

    // Try Login first, if not found, try Join
    try {
      // First, check if student exists to determine if we are joining or logging in
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', foundClass.id)
        .eq('name', studentName.trim())
        .single()

      const action = existing ? 'login' : 'join'
      
      const response = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          classId: foundClass.id,
          name: studentName.trim(),
          pin
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

      setTexts(classTexts || [])
      setStep('select-text')
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen atmospheric-bg flex flex-col items-center justify-center p-6">
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
            <form onSubmit={handleAuth} className="space-y-8">
              <div className="text-center mb-8 bg-white/20 py-4 rounded-2xl border border-white/40">
                <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest">Entering</span>
                <h2 className="text-2xl text-charcoal">{foundClass.name}</h2>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-charcoal/60 px-2">
                  What&apos;s your name?
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
                  PIN (4-digit required)
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
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enter Space'}
                <ArrowRight className="w-6 h-6" />
              </PillButton>
            </form>
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
                  texts.map((text) => (
                    <button
                      key={text.id}
                      onClick={() => router.push(`/annotate/${text.id}?student=${studentId}`)}
                      className="w-full flex items-center gap-5 p-5 bg-white/20 hover:bg-white/50 border border-white/40 rounded-3xl transition-all group text-left shadow-sm"
                    >
                      <div className="w-12 h-12 glass bg-white/80 rounded-2xl flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <span className="text-lg text-charcoal">{text.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
