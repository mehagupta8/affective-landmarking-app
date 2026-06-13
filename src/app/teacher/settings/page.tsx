'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  User as UserIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [fullName, setFullName] = useState('')

  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) {
        router.push('/teacher/login')
        return
      }
      setUser(user)
      setFullName(user.user_metadata?.full_name || '')
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

      <div className="max-w-xl">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <UserIcon className="w-6 h-6 text-terracotta" />
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
                  <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-terracotta/40" />
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
      </div>
    </div>
  )
}
