'use client'

import { useState, useEffect, ReactNode, FormEvent } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { Loader2, UserCircle2 } from 'lucide-react'

function splitFullName(name: string | undefined) {
  if (!name) return { first: '', last: '' }
  const parts = name.trim().split(/\s+/)
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function ProfileSetup({ user, onComplete }: { user: User; onComplete: () => void }) {
  const initial = splitFullName(user.user_metadata?.full_name as string | undefined)
  const [firstName, setFirstName] = useState(initial.first)
  const [lastName, setLastName] = useState(initial.last)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first || !last) { setError('Both fields are required.'); return }
    setSaving(true)
    const { error: err } = await supabase
      .from('student_profiles')
      .insert({ id: user.id, first_name: first, last_name: last })
    setSaving(false)
    if (err) { setError(err.message); return }
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[100] atmospheric-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-white/40 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <UserCircle2 className="w-10 h-10 text-terracotta" />
          </div>
          <h1 className="text-3xl font-normal text-charcoal">Welcome</h1>
          <p className="text-warm-grey text-base mt-2 font-light">Tell us your name to get started.</p>
        </div>

        {error && (
          <div className="bg-red-50/30 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 px-2">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-5 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-charcoal placeholder:text-warm-grey/30"
                placeholder="Ada"
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
                required
              />
            </div>
          </div>
          <PillButton type="submit" disabled={saving} className="w-full py-4 text-lg flex items-center justify-center gap-3">
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continue'}
          </PillButton>
        </form>
      </GlassCard>
    </div>
  )
}

export function StudentAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [hasProfile, setHasProfile] = useState(false)

  const publicRoutes = ['/student/login', '/student/signup']
  const isPublic = publicRoutes.some(r => pathname?.startsWith(r))

  const checkUser = async (u: User | null) => {
    if (!u) {
      setUser(null)
      setHasProfile(false)
      setLoading(false)
      if (!isPublic) router.push('/student/login')
      return
    }

    // Block teachers from accessing student routes
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id')
      .eq('id', u.id)
      .maybeSingle()

    if (teacherProfile) {
      router.push('/teacher/dashboard')
      return
    }

    setUser(u)
    const { data: profile, error } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('id', u.id)
      .maybeSingle()

    setHasProfile(!error && !!profile)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => checkUser(data?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      void checkUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [pathname])

  if (isPublic) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
      </div>
    )
  }

  if (!user) return null

  if (!hasProfile) {
    return <ProfileSetup user={user} onComplete={() => setHasProfile(true)} />
  }

  return <>{children}</>
}
