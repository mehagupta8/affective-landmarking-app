'use client'

import { useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { TeacherProfileOnboarding } from './TeacherProfileOnboarding'

export function TeacherAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [hasProfile, setHasProfile] = useState(false)

  const isPublicRoute = pathname === '/teacher/login' ||
                        pathname?.startsWith('/teacher/login/') ||
                        pathname === '/teacher/signup' ||
                        pathname?.startsWith('/teacher/signup/')

  useEffect(() => {
    const applyUser = async (user: User | null) => {
      if (!user) {
        setAuthenticated(false)
        setCurrentUser(null)
        setHasProfile(false)
        setLoading(false)
        return
      }
      setAuthenticated(true)
      setCurrentUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      if (profileError) {
        console.warn('teacher_profiles lookup failed; skipping onboarding gate:', profileError.message)
        setHasProfile(true)
      } else {
        setHasProfile(!!profile)
      }
      setLoading(false)
    }

    supabase.auth.getUser().then(({ data }) => applyUser(data?.user ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname])

  if (isPublicRoute || (!loading && !authenticated)) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
      </div>
    )
  }

  if (currentUser && !hasProfile) {
    return (
      <TeacherProfileOnboarding
        user={currentUser}
        onComplete={() => setHasProfile(true)}
      />
    )
  }

  return <>{children}</>
}
