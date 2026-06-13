'use client'

import { useState, FormEvent } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Loader2, UserCircle2 } from 'lucide-react'

interface Props {
  user: User
  onComplete: () => void
}

function splitFullName(fullName: string | undefined): { first: string; last: string } {
  if (!fullName) return { first: '', last: '' }
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

export function TeacherProfileOnboarding({ user, onComplete }: Props) {
  const initial = splitFullName(user.user_metadata?.full_name as string | undefined)
  const [firstName, setFirstName] = useState(initial.first)
  const [lastName, setLastName] = useState(initial.last)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [institution, setInstitution] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const first = firstName.trim()
    const last = lastName.trim()
    const inst = institution.trim()
    if (!first || !last || !dateOfBirth || !inst) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase
      .from('teacher_profiles')
      .insert({
        id: user.id,
        first_name: first,
        last_name: last,
        date_of_birth: dateOfBirth,
        institution: inst,
      })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
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
          <p className="text-warm-grey text-base mt-2 font-light">
            Tell us a little about yourself to get started.
          </p>
        </div>

        {error && (
          <div className="bg-red-50/30 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 px-2">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-5 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal placeholder:text-warm-grey/30"
                placeholder="Ada"
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/60 px-2">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-5 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal placeholder:text-warm-grey/30"
                placeholder="Lovelace"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-charcoal/60 px-2">Date of birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal placeholder:text-warm-grey/30"
              autoComplete="bday"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-charcoal/60 px-2">Institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-6 py-4 bg-white/30 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none transition-all text-charcoal placeholder:text-warm-grey/30"
              placeholder="Lincoln High School"
              autoComplete="organization"
              required
            />
          </div>

          <PillButton
            type="submit"
            disabled={saving}
            className="w-full py-4 text-lg flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continue'}
          </PillButton>
        </form>
      </GlassCard>
    </div>
  )
}
