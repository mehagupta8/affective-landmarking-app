'use client'

import { useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'

export function TeacherPinGuard({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [hasPin, setHasPin] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [settingPin, setSettingPin] = useState(false)

  useEffect(() => {
    const checkPin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userPin = user.user_metadata?.pin
        if (userPin) {
          setHasPin(true)
        } else {
          setHasPin(false)
        }
      } else {
        // If no user, allow passthrough so login/signup pages can render.
        // The middleware already protects authenticated routes.
        setIsVerified(true)
        setLoading(false)
        return
      }
      setLoading(false)
    }
    checkPin()
  }, [])

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits')
      return
    }
    setSettingPin(true)
    const { error: updateError } = await supabase.auth.updateUser({
      data: { pin: pin }
    })
    if (updateError) {
      setError(updateError.message)
    } else {
      setHasPin(true)
      setIsVerified(true)
    }
    setSettingPin(false)
  }

  const handleVerifyPin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.pin === pin) {
      setIsVerified(true)
    } else {
      setError('Incorrect PIN')
      setPin('')
    }
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
