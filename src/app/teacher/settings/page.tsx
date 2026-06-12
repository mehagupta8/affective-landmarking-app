'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Lock, 
  Key, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Fingerprint
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile State
  const [fullName, setFullName] = useState('')

  // Security State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setNewConfirmPassword] = useState('')
  const [newPin, setNewPin] = useState('')

  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/teacher/login')
        return
      }
      setUser(user)
      setFullName(user.user_metadata?.full_name || '')
      setNewPin(user.user_metadata?.pin || '')
      setLoading(false)
    }
    void fetchUser()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully.' })
    }
    setUpdating(false)
  }

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      setUpdating(false)
      return
    }

    if (newPin && !/^\d{4}$/.test(newPin)) {
      setMessage({ type: 'error', text: 'PIN must be exactly 4 digits.' })
      setUpdating(false)
      return
    }

    const updates: any = { data: { pin: newPin } }
    if (newPassword) updates.password = newPassword

    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Security settings updated successfully.' })
      setNewPassword('')
      setNewConfirmPassword('')
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-3">
        <h1 className="text-6xl font-normal text-charcoal">Settings</h1>
        <p className="text-warm-grey text-xl font-light">Customize your teaching environment and account preferences.</p>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300",
          message.type === 'success' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Profile Settings */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <User className="w-6 h-6 text-terracotta" />
            <h2 className="text-4xl text-charcoal font-light">Profile</h2>
          </div>

          <GlassCard className="p-10 border-white/40 shadow-lg">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-charcoal/60 px-2 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-grey/40" />
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full pl-16 pr-6 py-4 bg-charcoal/[0.03] border-none rounded-full text-charcoal/40 cursor-not-allowed text-lg"
                  />
                </div>
                <p className="text-[10px] text-warm-grey/40 px-4 italic">Email cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-charcoal/60 px-2 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta/40" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal transition-all"
                    placeholder="e.g. Professor Smith"
                  />
                </div>
              </div>

              <PillButton 
                type="submit" 
                disabled={updating}
                className="w-full py-4 flex items-center justify-center gap-3 mt-4"
              >
                {updating && <Loader2 className="w-5 h-5 animate-spin" />}
                Update Profile
              </PillButton>
            </form>
          </GlassCard>
        </div>

        {/* Security Settings */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <Lock className="w-6 h-6 text-terracotta" />
            <h2 className="text-4xl text-charcoal font-light">Security</h2>
          </div>

          <GlassCard className="p-10 border-white/40 shadow-lg">
            <form onSubmit={handleUpdateSecurity} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-charcoal/60 px-2 uppercase tracking-widest">Classroom PIN</label>
                <div className="relative">
                  <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta/40" />
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full pl-16 pr-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal tracking-[0.5em] transition-all"
                    placeholder="••••"
                    maxLength={4}
                  />
                </div>
                <p className="text-[10px] text-warm-grey/60 px-4">The 4-digit code you use to unlock your portal.</p>
              </div>

              <div className="h-px bg-charcoal/5 my-2" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-charcoal/60 px-2 uppercase tracking-widest">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta/40" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-16 pr-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal transition-all"
                      placeholder="Leave blank to keep current"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-charcoal/60 px-2 uppercase tracking-widest">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta/40" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      className="w-full pl-16 pr-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal transition-all"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>

              <PillButton 
                type="submit" 
                disabled={updating}
                className="w-full py-4 flex items-center justify-center gap-3 mt-4"
              >
                {updating && <Loader2 className="w-5 h-5 animate-spin" />}
                Save Security Settings
              </PillButton>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
