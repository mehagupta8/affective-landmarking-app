'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, User, Shield, LogOut, Mail, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { Student } from '@/types/database'

export default function StudentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [identities, setIdentities] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setIdentities(user.identities || [])
    }

    const meRes = await fetch('/api/student/me')
    if (meRes.ok) {
      const meData = await meRes.json()
      setStudent(meData)
      setDisplayName(meData.name)
    } else {
      router.push('/join')
    }
    setLoading(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('students')
      .update({ name: displayName })
      .eq('id', student.id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile.' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    }
    setSaving(false)
  }

  const hasGoogle = identities.some(id => id.provider === 'google')
  const hasEmail = identities.some(id => id.provider === 'email')
  
  const handleLinkGoogle = async () => {
    await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: window.location.href } })
  }

  const handleUnlinkGoogle = async () => {
    if (identities.length <= 1) {
      setMessage({ type: 'error', text: 'Cannot unlink your only login method.' })
      return
    }
    const googleIdentity = identities.find(id => id.provider === 'google')
    if (googleIdentity) {
      await supabase.auth.unlinkIdentity(googleIdentity)
      fetchData()
      setMessage({ type: 'success', text: 'Google account unlinked.' })
    }
  }

  const handleGlobalSignOut = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/join')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
    </div>
  )

  return (
    <div className="min-h-screen atmospheric-bg py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/join" className="inline-flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="text-center space-y-4 relative">
          <Orb size="sm" className="mx-auto opacity-50" />
          <h1 className="text-4xl font-normal text-charcoal">Account Settings</h1>
          <p className="text-warm-grey font-light text-lg">Manage your identity and connected devices.</p>
        </div>

        {message && (
          <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full bg-red-600 shrink-0" />}
            {message.text}
          </div>
        )}

        <GlassCard className="p-8 shadow-xl border-white/40 space-y-6">
          <div className="flex items-center gap-3 border-b border-charcoal/5 pb-4 mb-6">
            <User className="w-6 h-6 text-terracotta" />
            <h2 className="text-2xl text-charcoal">Profile</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-6 py-4 bg-white/50 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal text-lg shadow-sm"
              />
            </div>
            
            <div className="flex justify-end">
              <PillButton type="submit" disabled={saving} className="py-3 px-8 gap-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </PillButton>
            </div>
          </form>
        </GlassCard>

        {identities.length > 0 && (
          <GlassCard className="p-8 shadow-xl border-white/40 space-y-6">
            <div className="flex items-center gap-3 border-b border-charcoal/5 pb-4 mb-6">
              <Shield className="w-6 h-6 text-terracotta" />
              <h2 className="text-2xl text-charcoal">Connected Accounts</h2>
            </div>

            <div className="space-y-4">
              {hasGoogle ? (
                <div className="flex items-center justify-between p-4 bg-white/30 rounded-2xl border border-white/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm p-2">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">Google Account Connected</p>
                      <p className="text-xs text-warm-grey">Secure sign-in enabled</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleUnlinkGoogle}
                    disabled={identities.length === 1}
                    className="text-xs font-bold uppercase tracking-widest text-warm-grey/60 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-warm-grey/60"
                  >
                    Unlink
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLinkGoogle}
                  className="w-full flex items-center justify-between p-4 bg-white/30 hover:bg-white/50 transition-colors rounded-2xl border border-white/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm p-2 group-hover:scale-110 transition-transform">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-charcoal">Link Google Account</p>
                      <p className="text-xs text-warm-grey">For 1-click secure sign-in</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-terracotta mr-2">
                    Connect
                  </span>
                </button>
              )}
            </div>
            
            {identities.length === 1 && hasGoogle && (
              <p className="text-xs text-warm-grey/60 mt-4 px-2">
                Note: You must have at least one login method. You cannot unlink Google until you add another sign-in method.
              </p>
            )}
          </GlassCard>
        )}

        <GlassCard className="p-8 shadow-xl border-white/40 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl text-charcoal">Sessions</h2>
            </div>
          </div>
          
          <p className="text-sm text-warm-grey leading-relaxed">
            Sign out of all devices to invalidate your current session everywhere. You will need to sign in again to access the class texts.
          </p>
          
          <button 
            onClick={handleGlobalSignOut}
            className="w-full py-4 text-center text-sm font-bold uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100"
          >
            Sign Out of All Devices
          </button>
        </GlassCard>

      </div>
    </div>
  )
}
