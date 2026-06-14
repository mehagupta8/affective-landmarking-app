'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowRight, Loader2, LogOut, Ghost } from 'lucide-react'
import { Text } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'

export default function GuestClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params)
  const [texts, setTexts] = useState<Text[]>([])
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // Verify guest session
      const res = await fetch('/api/guest/me')
      if (!res.ok) {
        router.push('/join')
        return
      }
      const guest = await res.json()
      if (guest.class_id !== classId) {
        router.push('/join')
        return
      }
      setGuestName(guest.display_name)

      // Fetch texts
      const { data } = await supabase
        .from('texts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
      setTexts(data || [])
      setLoading(false)
    }
    void init()
  }, [classId, router])

  const handleLeave = async () => {
    await fetch('/api/guest/auth', { method: 'DELETE' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
      </div>
    )
  }

  return (
    <div className="min-h-screen atmospheric-bg py-8 px-4 md:py-12 md:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-end justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-terracotta uppercase tracking-widest">
              <Ghost className="w-3.5 h-3.5" />
              Guest Session
            </div>
            <h1 className="text-3xl md:text-5xl font-normal text-charcoal">
              Welcome, {guestName}
            </h1>
            <p className="text-warm-grey text-base font-light">
              Pick a text to begin annotating.
            </p>
          </div>
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-warm-grey/50 hover:text-red-400 hover:bg-red-50/30 transition-all text-sm border border-white/40 glass"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </header>

        <div className="space-y-4">
          {texts.length === 0 ? (
            <GlassCard className="py-24 text-center border-dashed border-2 border-white/30 bg-white/10">
              <BookOpen className="w-12 h-12 text-warm-grey/30 mx-auto mb-4" />
              <p className="text-warm-grey font-light">No texts assigned yet. Check back later.</p>
            </GlassCard>
          ) : (
            texts.map(text => (
              <GlassCard key={text.id} className="p-6 md:p-8 flex items-center justify-between gap-6 group hover:-translate-y-0.5 transition-all duration-300 border-white/40">
                <div className="space-y-1 min-w-0">
                  <h2 className="text-xl md:text-2xl text-charcoal group-hover:text-terracotta transition-colors truncate">
                    {text.title}
                  </h2>
                  {text.author && (
                    <p className="text-sm text-warm-grey/60 italic font-serif">by {text.author}</p>
                  )}
                </div>
                <Link href={`/annotate/${text.id}`} className="shrink-0">
                  <PillButton className="flex items-center gap-2 px-6 py-3">
                    Start
                    <ArrowRight className="w-4 h-4" />
                  </PillButton>
                </Link>
              </GlassCard>
            ))
          )}
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-warm-grey/30 tracking-widest uppercase">
            Guest session · expires in 24 hours · annotations saved until then
          </p>
        </div>
      </div>
    </div>
  )
}
