'use client'

import { useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'

export function TeacherPinGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [settingPin, setSettingPin] = useState(false)

  // Public teacher routes that don't need PIN protection
  // Include exact matches and sub-routes for login and signup
  const isPublicRoute = pathname === '/teacher/login' || 
                        pathname?.startsWith('/teacher/login/') ||
                        pathname === '/teacher/signup' ||
                        pathname?.startsWith('/teacher/signup/')

  useEffect(() => {
    console.log('TeacherPinGuard mounted on:', pathname)
    
    // Initial check
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      const user = data?.user
      
      console.log('Initial user check:', { user: user?.id, error: error?.message })
      
      if (user) {
        setAuthenticated(true)
        const userPin = user.user_metadata?.pin
        setHasPin(!!userPin)
      } else {
        setAuthenticated(false)
        setHasPin(false)
      }
      setLoading(false)
    }
    
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user
      console.log('Auth state change:', { event, user: user?.id })
      
      if (user) {
        setAuthenticated(true)
        const userPin = user.user_metadata?.pin
        setHasPin(!!userPin)
      } else {
        setAuthenticated(false)
        setHasPin(false)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname])

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits')
      return
    }
    setSettingPin(true)
    setError(null)
    
    // Step 3: Log session to confirm it exists in the browser
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('Current session before PIN set:', sessionData.session ? 'Session exists' : 'NO SESSION')

    const attemptUpdate = async (isRetry = false): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log(`${isRetry ? 'Retrying' : 'Attempting'} PIN update...`)
        const { error: updateError } = await supabase.auth.updateUser({
          data: { pin: pin }
        })
        
        if (updateError) {
          console.error('PIN update error:', updateError)
          // Step 5: Check for AuthSessionMissingError (standard message is "Auth session missing!")
          if (updateError.message.includes('Auth session missing') && !isRetry) {
            console.log('Session missing, attempting refresh and retry...')
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            
            if (!refreshError && refreshData.session) {
              console.log('Refresh successful, retrying...')
              return await attemptUpdate(true)
            } else {
              return { success: false, error: refreshError?.message || 'Session expired. Please log in again.' }
            }
          }
          return { success: false, error: updateError.message }
        }
        
        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { success: false, error: message }
      }
    }

    const result = await attemptUpdate()
    
    if (result.success) {
      setHasPin(true)
      setIsVerified(true)
    } else {
      setError(result.error || 'An unexpected error occurred')
    }
    
    setSettingPin(false)
  }

  const handleVerifyPin = async () => {
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (user?.user_metadata?.pin === pin) {
      setIsVerified(true)
    } else {
      setError('Incorrect PIN')
      setPin('')
    }
  }

  // If it's a public route or we're not authenticated yet, don't show the guard
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

  if (!isVerified) {
    return (
      <div className="fixed inset-0 z-[100] atmospheric-bg flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-white/40 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm">
              {hasPin ? <Lock className="w-10 h-10 text-terracotta" /> : <ShieldCheck className="w-10 h-10 text-terracotta" />}
            </div>
            <h1 className="text-3xl font-normal text-charcoal">
              {hasPin ? 'Identity Verification' : 'Secure Your Account'}
            </h1>
            <p className="text-warm-grey text-base mt-2 font-light">
              {hasPin ? 'Please enter your 4-digit PIN to continue.' : 'Create a 4-digit PIN for your classroom portal.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50/30 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setError(null)
                setPin(e.target.value)
              }}
              className="w-full text-center text-4xl tracking-[1em] px-4 py-6 bg-white/30 border-none rounded-[28px] focus:ring-2 focus:ring-terracotta/20 outline-none transition-all placeholder:text-warm-grey/10 text-charcoal"
              placeholder="••••"
              maxLength={4}
            />

            <PillButton
              onClick={hasPin ? handleVerifyPin : handleSetPin}
              disabled={settingPin || pin.length < 4}
              className="w-full py-5 text-xl flex items-center justify-center gap-3"
            >
              {settingPin ? <Loader2 className="w-6 h-6 animate-spin" /> : (hasPin ? 'Unlock Portal' : 'Set PIN & Continue')}
            </PillButton>
          </div>
        </GlassCard>
      </div>
    )
  }

  return <>{children}</>
}

