'use client'

import React, { useState, useEffect, useRef, useCallback, use, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  X,
  Loader2,
  CheckCircle2,
  Mail,
  Send,
  AlertTriangle
} from 'lucide-react'
import { Text, StudentProfile, Annotation, RASA_CONFIGS, RasaLabel } from '@/types/database'

interface GuestInfo { id: string; display_name: string; class_id: string; submitted_texts: string[] }
import { cn } from '@/lib/utils'
import { Orb } from '@/components/ui/Orb'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { MiniSpectrum } from '@/components/viz/MiniSpectrum'
import { StudentSignOut } from '@/components/student/StudentSignOut'

export default function AnnotationPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const router = useRouter()

  const [text, setText] = useState<Text | null>(null)
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [guest, setGuest] = useState<GuestInfo | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [showTriggerWarning, setShowTriggerWarning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isPastDeadline = useMemo(() => {
    if (!text?.due_date) return false
    return new Date(text.due_date) < new Date()
  }, [text])

  const isLocked = isSubmitted || isPastDeadline

  // Management State
  const [activeGroup, setActiveGroup] = useState<{ anns: Annotation[], rect: DOMRect } | null>(null)

  // Selection State
  const [selection, setSelection] = useState<{ start: number, end: number, rect: DOMRect } | null>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  const progress = useMemo(() => {
    if (!text || text.content.length === 0) return 0
    const intervals = annotations
      .map(a => [a.start_offset, a.end_offset])
      .sort((a, b) => a[0] - b[0])

    if (intervals.length === 0) return 0

    const merged = [[...intervals[0]]]
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1]
      const curr = intervals[i]
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1])
      } else {
        merged.push([...curr])
      }
    }

    const totalCovered = merged.reduce((acc, [start, end]) => acc + (end - start), 0)
    return Math.min(100, Math.round((totalCovered / text.content.length) * 100))
  }, [annotations, text])

  const fetchInitialData = useCallback(async () => {
    try {
      // Try student auth first
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: prof } = await supabase
          .from('student_profiles').select('*').eq('id', user.id).single()
        if (!prof) { router.push('/student/login'); return }
        setStudent(prof)

        const [textRes, annRes, enrollRes] = await Promise.all([
          supabase.from('texts').select('*').eq('id', textId).single(),
          supabase.from('annotations').select('*').eq('text_id', textId).eq('student_id', user.id),
          supabase.from('class_enrollments').select('submitted_texts').eq('student_id', user.id)
        ])
        if (textRes.error || !textRes.data) { router.push('/student/dashboard'); return }
        setText(textRes.data)
        setAnnotations(annRes.data || [])
        const allSubmitted = (enrollRes.data || []).flatMap((e: { submitted_texts: string[] | null }) => e.submitted_texts || [])
        if (allSubmitted.includes(textId)) setIsSubmitted(true)
        if (textRes.data.trigger_warning) setShowTriggerWarning(true)
        return
      }

      // Fall back to guest session
      const guestRes = await fetch('/api/guest/me')
      if (!guestRes.ok) { router.push('/join'); return }
      const guestData: GuestInfo = await guestRes.json()
      setGuest(guestData)

      const [textRes, annRes] = await Promise.all([
        supabase.from('texts').select('*').eq('id', textId).single(),
        supabase.from('annotations').select('*').eq('text_id', textId).eq('guest_id', guestData.id)
      ])
      if (textRes.error || !textRes.data) { router.push(`/guest/${guestData.class_id}`); return }
      setText(textRes.data)
      setAnnotations(annRes.data || [])
      if ((guestData.submitted_texts || []).includes(textId)) setIsSubmitted(true)
      if (textRes.data.trigger_warning) setShowTriggerWarning(true)
    } catch {
      router.push('/join')
    } finally {
      setLoading(false)
    }
  }, [textId, router])

  useEffect(() => {
    void fetchInitialData()
  }, [fetchInitialData])

  const handleMouseUp = () => {
    if (isLocked) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !textRef.current) {
      setSelection(null)
      return
    }

    const range = sel.getRangeAt(0)
    if (!textRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null)
      return
    }

    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(textRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    const end = start + range.toString().length

    setSelection({
      start,
      end,
      rect: range.getBoundingClientRect()
    })
  }

  const createAnnotation = async (label: RasaLabel) => {
    if (!selection || !student || !textId || isLocked) return
    
    setSaving(true)
    const { data, error } = await supabase
      .from('annotations')
      .insert([{
        text_id: textId,
        ...(student ? { student_id: student.id } : { guest_id: guest!.id }),
        start_offset: selection.start,
        end_offset: selection.end,
        rasa_label: label
      }])
      .select()
      .single()

    if (!error) {
      setAnnotations([...annotations, data])
      setSelection(null)
      window.getSelection()?.removeAllRanges()
    }
    setSaving(false)
  }

  const deleteAnnotation = async (id: string) => {
    if (isLocked) return
    const { error } = await supabase.from('annotations').delete().eq('id', id)
    if (!error) {
      setAnnotations(annotations.filter(a => a.id !== id))
      if (activeGroup) {
        const remaining = activeGroup.anns.filter(a => a.id !== id)
        if (remaining.length === 0) setActiveGroup(null)
        else setActiveGroup({ ...activeGroup, anns: remaining })
      }
    }
  }

  const handleSubmit = async () => {
    if ((!student && !guest) || !textId || isLocked) return
    setSubmitting(true)

    if (student) {
      const { data: textData } = await supabase.from('texts').select('class_id').eq('id', textId).single()
      if (!textData) { setSubmitting(false); return }

      const { data: enrollment } = await supabase
        .from('class_enrollments')
        .select('id, submitted_texts')
        .eq('student_id', student.id)
        .eq('class_id', textData.class_id)
        .single()

      if (enrollment) {
        const submitted = enrollment.submitted_texts || []
        if (!submitted.includes(textId)) {
          const { error } = await supabase
            .from('class_enrollments')
            .update({ submitted_texts: [...submitted, textId] })
            .eq('id', enrollment.id)
          if (!error) {
            setIsSubmitted(true)
            router.push(`/annotate/${textId}/submitted`)
          }
        }
      }
    } else if (guest) {
      // Guest submit — update via API (service role needed)
      const res = await fetch(`/api/guest/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textId })
      })
      if (res.ok) {
        setIsSubmitted(true)
        router.push(`/annotate/${textId}/submitted`)
      }
    }
    setSubmitting(false)
  }

  const renderTextWithHighlights = () => {
    if (!text) return null
    const content = text.content
    const sortedAnnotations = [...annotations].sort((a, b) => 
      (b.end_offset - b.start_offset) - (a.end_offset - a.start_offset)
    )

    const charMap = content.split('').map((char, index) => {
      const activeAnns = sortedAnnotations.filter(a => index >= a.start_offset && index < a.end_offset)
      return { char, activeAnns }
    })

    const groups: { text: string, anns: Annotation[] }[] = []
    let currentGroup: { text: string, anns: Annotation[] } | null = null

    charMap.forEach((item) => {
      const annIds = item.activeAnns.map(a => a.id).join(',')
      if (!currentGroup || currentGroup.anns.map(a => a.id).join(',') !== annIds) {
        currentGroup = { text: item.char, anns: item.activeAnns }
        groups.push(currentGroup)
      } else {
        currentGroup.text += item.char
      }
    })

    return groups.map((group, i) => {
      if (group.anns.length === 0) return <span key={i}>{group.text}</span>

      // We wrap the text in nested spans, one for each emotion.
      // 'boxDecorationBreak: clone' ensures the highlight wraps tightly and 
      // renders independently for each line segment when wrapping.
      let element = <>{group.text}</>
      
      group.anns.forEach((ann, idx) => {
        element = (
          <span 
            key={ann.id}
            style={{
              backgroundColor: RASA_CONFIGS[ann.rasa_label].color,
              mixBlendMode: 'multiply',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              padding: '0.15em 0',
              borderRadius: '3px',
              opacity: 0.8 // Increased base opacity since they multiply
            }}
            className="inline"
          >
            {element}
          </span>
        )
      })

      return (
        <span 
          key={i} 
          className="inline leading-normal cursor-pointer hover:brightness-95 transition-all"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            setActiveGroup({ anns: group.anns, rect })
          }}
        >
          {element}
        </span>
      )
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3EC]">
      <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
    </div>
  )

  return (
    <div className="min-h-screen atmospheric-bg flex flex-col items-center py-6 md:py-12 px-3 md:px-6 relative">
      {/* Progress Bar — bottom full-width on mobile, bottom-left card on desktop */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-8 md:right-auto z-50 w-full md:max-w-sm animate-in slide-in-from-bottom duration-700 md:slide-in-from-left-8 md:duration-1000">
        <GlassCard className="p-4 md:p-6 shadow-2xl border-white/60 backdrop-blur-2xl rounded-none md:rounded-2xl">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em] mb-1">Your Progress</span>
              <span className="text-2xl font-light text-charcoal">{progress}% Completed</span>
            </div>
            
            {!isLocked && !isSubmitted ? (
              <div className="flex gap-2">
                <PillButton 
                  onClick={() => router.push('/student/dashboard')}
                  className="py-2 px-6 text-[10px] h-10 bg-white text-charcoal border border-charcoal/5 shadow-sm"
                >
                  Save & Exit
                </PillButton>
                <PillButton 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="py-2 px-6 text-[10px] h-10 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Submit Text
                </PillButton>
              </div>
            ) : isSubmitted ? (
              <div className="flex items-center gap-4">
                <Link href="/student/dashboard">
                  <PillButton className="py-2 px-6 text-[10px] h-10 bg-white text-charcoal border border-charcoal/5 shadow-sm">
                    Return to Dashboard
                  </PillButton>
                </Link>
                <div className="flex items-center gap-2 text-terracotta bg-terracotta/5 px-4 py-2 rounded-full border border-terracotta/10">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Submitted</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="h-2 w-full bg-charcoal/5 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-terracotta transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(232,155,108,0.4)]"
              style={{ width: `${progress}%`, opacity: 0.4 + (progress / 100) * 0.6 }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Emotional Barcode (Live)</span>
              <span className="text-[8px] font-bold text-warm-grey/40 uppercase tracking-widest">Beginning → End</span>
            </div>
            <MiniSpectrum 
              textLength={text?.content.length || 0} 
              annotations={annotations} 
              height={32}
              className="shadow-inner bg-charcoal/[0.02] rounded-lg border border-charcoal/5"
            />
          </div>
        </GlassCard>
      </div>

      {/* Student Session Header */}
      {student && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-700">
          <GlassCard className="flex items-center gap-6 px-6 py-3 border-white/40 shadow-lg">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-0.5">
                <Mail className="w-3 h-3 text-terracotta/40" />
                <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest">
                  {guest ? 'Guest' : 'Logged in as'}
                </span>
              </div>
              <span className="text-sm text-charcoal font-medium">
                {guest ? guest.display_name : `${student?.first_name} ${student?.last_name}`}
              </span>
            </div>
            <div className="w-px h-8 bg-charcoal/10" />
            <StudentSignOut />
          </GlassCard>
        </div>
      )}

      {/* Trigger Warning Modal */}
      {showTriggerWarning && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[40px] z-50 flex items-center justify-center p-8">
          <GlassCard className="max-w-xl w-full p-12 shadow-2xl flex flex-col items-center text-center space-y-8">
            <Orb size="lg" className="shadow-[0_0_30px_rgba(232,155,108,0.3)]" />
            <div className="space-y-4">
              <h2 className="text-3xl text-charcoal">Content Warning</h2>
              <p className="text-warm-grey text-lg leading-relaxed">
                &quot;{text?.trigger_warning}&quot;
              </p>
            </div>
            <PillButton 
              onClick={() => setShowTriggerWarning(false)}
              className="w-full py-4 text-xl"
            >
              I&apos;m ready to begin
            </PillButton>
          </GlassCard>
        </div>
      )}

      {/* Header / Nav */}
      <header className="w-full max-w-4xl flex justify-between items-center px-8 py-8">
        <Link href="/student/dashboard" className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-warm-grey">{student ? `${student.first_name} ${student.last_name}` : ''}</span>
          <Orb size="xs" animate={saving} className={cn(saving ? "opacity-100" : "opacity-40")} />
        </div>
      </header>

      {/* Main Reading Surface */}
      <main ref={mainRef} className="w-full max-w-[720px] mb-32 relative">
        {isPastDeadline && !isSubmitted && (
          <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4 duration-700">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Assignment Closed</p>
              <p className="text-sm font-light leading-relaxed">The deadline for this text has passed. Your annotations are now in read-only mode.</p>
            </div>
          </div>
        )}

        <div className="bg-[#FDFBF7] px-16 py-24 shadow-[0_4px_40px_rgba(0,0,0,0.02)] rounded-sm relative">
          <header className="mb-16 space-y-8">
            <div className="space-y-2">
              <h1 className="text-5xl font-normal text-charcoal leading-tight">
                {text?.title}
              </h1>
              {text?.author && (
                <p className="text-2xl text-warm-grey font-light">by {text.author}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-6 items-center border-y border-charcoal/5 py-6">
              {text?.source && (
                <div className="flex flex-col gap-1 border-r border-charcoal/5 pr-6">
                  <span className="text-[8px] font-black text-warm-grey/40 uppercase tracking-[0.2em]">Source</span>
                  <span className="text-xs text-charcoal/60 italic font-serif">{text.source}</span>
                </div>
              )}
              {text?.due_date && (
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-warm-grey/40 uppercase tracking-[0.2em]">Deadline</span>
                  <span className={cn(
                    "text-xs font-bold",
                    isPastDeadline ? "text-red-500" : "text-terracotta"
                  )}>
                    {new Date(text.due_date).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {text?.instructions && (
              <div className="bg-charcoal/[0.02] p-8 rounded-2xl border border-charcoal/5">
                <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em] block mb-3">Teacher Instructions</span>
                <p className="text-charcoal/70 leading-relaxed font-light whitespace-pre-wrap">
                  {text.instructions}
                </p>
              </div>
            )}
          </header>
          
          <div 
            ref={textRef}
            onMouseUp={handleMouseUp}
            className={cn(
              "text-xl leading-[1.8] text-charcoal/90 whitespace-pre-wrap selection:bg-terracotta/20 font-light",
              isLocked ? "cursor-default" : "cursor-text"
            )}
          >
            {renderTextWithHighlights()}
          </div>
        </div>

        {/* Floating Palette */}
        {selection && mainRef.current && (
          <div 
            className="absolute z-40 transform -translate-x-1/2 -translate-y-[110%] animate-in fade-in zoom-in duration-300"
            style={{ 
              top: selection.rect.top + window.scrollY - mainRef.current.offsetTop, 
              left: selection.rect.left + (selection.rect.width / 2) - mainRef.current.offsetLeft
            }}
          >
            <GlassCard className="w-[220px] p-2 flex flex-col shadow-2xl border-white/60">
              <div className="flex flex-col max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-charcoal/10">
                {(Object.keys(RASA_CONFIGS) as RasaLabel[]).map(label => {
                  const config = RASA_CONFIGS[label]
                  return (
                    <button
                      key={label}
                      onClick={() => createAnnotation(label)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/60 transition-colors group relative"
                      title={config.sanskrit}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-[15px] text-charcoal">{config.name}</span>
                    </button>
                  )
                })}
              </div>
              <div className="h-[1px] bg-charcoal/5 my-2" />
              <button 
                onClick={() => setSelection(null)}
                className="flex items-center justify-center py-2 text-warm-grey hover:text-charcoal transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </GlassCard>
          </div>
        )}

        {/* Management Palette (for existing highlights) */}
        {activeGroup && mainRef.current && (
          <div 
            className="absolute z-40 transform -translate-x-1/2 -translate-y-[110%] animate-in fade-in zoom-in duration-300"
            style={{ 
              top: activeGroup.rect.top + window.scrollY - mainRef.current.offsetTop, 
              left: activeGroup.rect.left + (activeGroup.rect.width / 2) - mainRef.current.offsetLeft
            }}
          >
            <GlassCard className="w-[220px] p-2 flex flex-col shadow-2xl border-white/60">
              <div className="px-3 py-2 border-b border-charcoal/5 mb-1">
                <span className="text-[10px] font-black text-terracotta uppercase tracking-widest">Active Emotions</span>
              </div>
              <div className="flex flex-col max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-charcoal/10">
                {activeGroup.anns.map(ann => {
                  const config = RASA_CONFIGS[ann.rasa_label]
                  return (
                    <div
                      key={ann.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-sm text-charcoal">{config.name}</span>
                      </div>
                      <button 
                        onClick={() => deleteAnnotation(ann.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="h-[1px] bg-charcoal/5 my-2" />
              <button 
                onClick={() => setActiveGroup(null)}
                className="flex items-center justify-center py-2 text-[10px] font-bold uppercase tracking-widest text-warm-grey hover:text-charcoal transition-colors"
              >
                Close
              </button>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  )
}

