'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, ChevronLeft, Ghost } from 'lucide-react'
import { Class } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'

type Step = 'code' | 'name'

export default function JoinPage() {
  const [step, setStep] = useState<Step>('code')
  const [classCode, setClassCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [foundClass, setFoundClass] = useState<Class & { allow_guests: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFindClass = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', classCode.trim().toUpperCase())
      .single()

    if (fetchError || !data) {
      setError('Invalid class code. Please check with your teacher.')
      setLoading(false)
      return
    }

    if (!data.allow_guests) {
      setError('This class does not allow guest access. Ask your teacher to enable it, or sign up as a student.')
      setLoading(false)
      return
    }

    setFoundClass(data as Class & { allow_guests: boolean })
    setStep('name')
    setLoading(false)
  }

  const handleJoinAsGuest = async (e: FormEvent) => {
    e.preventDefault()
    if (!foundClass || !displayName.trim()) return
    setLoading(true)
    setError(null)

    // Sign out any existing student/teacher session so the annotate page
    // serves the guest experience instead of the logged-in user's data.
    await supabase.auth.signOut()

    const res = await fetch('/api/guest/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: foundClass.id, displayName: displayName.trim() })
    })

    const result = await res.json()
    if (!res.ok) {
      setError(result.error || 'Failed to join. Please try again.')
      setLoading(false)
      return
    }

    router.push(`/guest/${foundClass.id}`)
  }

  return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-6 md:p-10 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-500">

        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-white/40 w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <Ghost className="w-8 h-8 text-terracotta" />
          </div>
          <h1 className="text-3xl font-normal text-charcoal">Join as Guest</h1>
          <p className="text-warm-grey text-sm mt-2 font-light">
            No account needed — enter a class code to begin.
          </p>
        </div>

        {error && (
          <div className="bg-red-50/30 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {step === 'code' && (
          <form onSubmit={handleFindClass} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 text-center uppercase tracking-widest">
                Class Code
              </label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="w-full text-center text-4xl font-mono tracking-[0.4em] px-4 py-6 bg-white/30 border-none rounded-[28px] focus:ring-2 focus:ring-terracotta/20 outline-none uppercase placeholder:text-warm-grey/10 text-charcoal"
                placeholder="------"
                maxLength={6}
                required
              />
            </div>
            <PillButton
              type="submit"
              disabled={loading || classCode.length < 6}
              className="w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find Class'}
              <ArrowRight className="w-5 h-5" />
            </PillButton>
          </form>
        )}

        {step === 'name' && foundClass && (
          <form onSubmit={handleJoinAsGuest} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center bg-white/30 rounded-2xl py-3 px-4">
              <p className="text-[10px] font-bold text-terracotta uppercase tracking-widest">Joining</p>
              <p className="text-xl text-charcoal font-medium">{foundClass.name}</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 px-2">
                Your display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal text-lg placeholder:text-warm-grey/30"
                placeholder="e.g. Blue Tiger"
                autoFocus
                required
              />
              <p className="text-xs text-warm-grey/40 px-2">This is how you&apos;ll appear to your teacher.</p>
            </div>
            <PillButton
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter as Guest'}
              <ArrowRight className="w-5 h-5" />
            </PillButton>
            <button
              type="button"
              onClick={() => { setStep('code'); setError(null) }}
              className="w-full text-center text-sm text-warm-grey/40 hover:text-charcoal transition-colors"
            >
              ← Different class
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-charcoal/5 text-center space-y-2">
          <p className="text-xs text-warm-grey/40">Have an account?</p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/student/login" className="text-terracotta hover:underline font-medium">Student login</Link>
            <span className="text-warm-grey/20">|</span>
            <Link href="/teacher/login" className="text-terracotta hover:underline font-medium">Teacher login</Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-warm-grey/30 hover:text-charcoal transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Home
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
