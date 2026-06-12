'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, BarChart2, ArrowRight, BookOpen } from 'lucide-react'
import { Text, Submission } from '@/types/database'
import { Clock, RefreshCcw } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'

export default function SubmissionSuccessPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const [text, setText] = useState<Text | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [unsubmitting, setUnsubmitting] = useState(false)
  const router = useRouter()


  const handleUnsubmit = async () => {
    if (!studentId || !textId) return
    setUnsubmitting(true)
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'draft' })
      .eq('student_id', studentId)
      .eq('text_id', textId)
      
    if (!error) {
      router.push(`/annotate/${textId}`)
    }
    setUnsubmitting(false)
  }

  const isPastDeadline = text?.deadline && new Date(text.deadline) < new Date()
  const canUnsubmit = submission?.status === 'submitted' && !isPastDeadline

  useEffect(() => {
    const fetchData = async () => {
      // Get student session
      const meRes = await fetch('/api/student/me')
      let meData = null
      if (meRes.ok) {
        meData = await meRes.json()
        setStudentId(meData.id)
      }

      // Get text info
      const { data } = await supabase.from('texts').select('*').eq('id', textId).single()
      if (data) setText(data)

      if (meData?.id) {
        const { data: subData } = await supabase.from('submissions').select('*').eq('student_id', meData.id).eq('text_id', textId).maybeSingle()
        if (subData) setSubmission(subData)
      }
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

          {canUnsubmit && (
            <button 
              onClick={handleUnsubmit}
              disabled={unsubmitting}
              className="w-full py-5 text-lg font-medium rounded-full bg-white border border-warm-grey/20 text-charcoal hover:bg-warm-grey/5 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className={`w-5 h-5 ${unsubmitting ? 'animate-spin' : ''}`} />
              {unsubmitting ? 'Unsubmitting...' : 'Unsubmit to Edit'}
            </button>
          )}

          {(isPastDeadline || submission?.status === 'locked') && (
             <div className="flex items-center justify-center gap-2 text-warm-grey/60 text-sm mt-2">
               <Clock className="w-4 h-4" />
               {isPastDeadline ? 'Deadline has passed. Editing is locked.' : 'Editing is locked.'}
             </div>
          )}
          
          <Link href="/join" className="text-warm-grey hover:text-charcoal transition-colors text-sm font-medium flex items-center justify-center gap-2 mt-4">
            <BookOpen className="w-4 h-4" />
            Return to Class Library
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
