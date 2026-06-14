'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, BarChart2, ArrowRight, BookOpen } from 'lucide-react'
import { Text } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'

export default function SubmissionSuccessPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const [text, setText] = useState<Text | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setStudentId(user.id)
      const { data } = await supabase.from('texts').select('*').eq('id', textId).single()
      if (data) setText(data)
    }
    fetchData()
  }, [textId])

  return (
    <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-xl w-full p-12 text-center space-y-10 shadow-2xl border-white/40 animate-in zoom-in fade-in duration-700">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-white/40 w-24 h-24 rounded-full flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-terracotta" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-normal text-charcoal">Text Submitted</h1>
            <p className="text-warm-grey text-lg font-light">
              Your emotional journey through <span className="text-charcoal font-medium">&quot;{text?.title}&quot;</span> has been recorded.
            </p>
          </div>
        </div>

        <div className="bg-terracotta/5 border border-terracotta/10 p-8 rounded-3xl space-y-4">
          <Orb size="xs" className="mx-auto opacity-60" />
          <p className="text-charcoal/70 text-sm leading-relaxed">
            By sharing your feelings, you&apos;ve contributed to the class collective. 
            You now have access to the Consolidated Spectrum.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href={`/annotate/${textId}/spectrum?student=${studentId}`} className="w-full">
            <PillButton className="w-full py-5 text-xl flex items-center justify-center gap-3">
              <BarChart2 className="w-6 h-6" />
              View Class Spectrum
              <ArrowRight className="w-6 h-6" />
            </PillButton>
          </Link>
          
          <Link href="/student/dashboard" className="text-warm-grey hover:text-charcoal transition-colors text-sm font-medium flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
