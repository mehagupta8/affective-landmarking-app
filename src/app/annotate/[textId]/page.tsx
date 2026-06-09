'use client'

import React, { useState, useEffect, useRef, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  X,
  Loader2
} from 'lucide-react'
import { Text, Student, Annotation, RASA_CONFIGS, RasaLabel } from '@/types/database'
import { cn } from '@/lib/utils'
import { Orb } from '@/components/ui/Orb'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { StudentSignOut } from '@/components/student/StudentSignOut'

export default function AnnotationPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const router = useRouter()

  const [text, setText] = useState<Text | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [showTriggerWarning, setShowTriggerWarning] = useState(false)
  const [saving, setSaving] = useState(false)

  // Selection State
  const [selection, setSelection] = useState<{ start: number, end: number, rect: DOMRect } | null>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const fetchInitialData = useCallback(async () => {
    try {
      // 1. Fetch current student from session
      const meRes = await fetch('/api/student/me')
      if (!meRes.ok) {
        router.push('/join')
        return
      }
      const meData = await meRes.json()
      setStudent(meData)

      // 2. Fetch text and existing annotations
      const [textRes, annRes] = await Promise.all([
        supabase.from('texts').select('*').eq('id', textId).single(),
        supabase.from('annotations').select('*').eq('text_id', textId).eq('student_id', meData.id)
      ])

      if (textRes.error || !textRes.data) {
        router.push('/join')
        return
      }

      setText(textRes.data)
      setAnnotations(annRes.data || [])
      
      if (textRes.data.trigger_warning) {
        setShowTriggerWarning(true)
      }
    } catch (err) {
      router.push('/join')
    } finally {
      setLoading(false)
    }
  }, [textId, router])

  useEffect(() => {
    void fetchInitialData() // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchInitialData])

  const handleMouseUp = () => {
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
    if (!selection || !student || !textId) return
    
    setSaving(true)
    const { data, error } = await supabase
      .from('annotations')
      .insert([{
        text_id: textId,
        student_id: student.id,
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
      return (
        <span key={i} className="relative inline">
          {group.anns.map((ann, idx) => (
            <span 
              key={ann.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: RASA_CONFIGS[ann.rasa_label].color,
                opacity: 0.25,
                zIndex: idx + 1,
                mixBlendMode: 'multiply'
              }}
            />
          ))}
          {group.text}
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
    <div className="min-h-screen atmospheric-bg flex flex-col items-center py-12 px-6 relative">
      {/* Student Session Header */}
      {student && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-700">
          <GlassCard className="flex items-center gap-6 px-6 py-3 border-white/40 shadow-lg">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-terracotta uppercase tracking-widest">Logged in as</span>
              <span className="text-sm text-charcoal font-medium">{student.name}</span>
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
        <Link href="/join" className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Exit
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-warm-grey">{student?.name}</span>
          <Orb size="xs" animate={saving} className={cn(saving ? "opacity-100" : "opacity-40")} />
        </div>
      </header>

      {/* Main Reading Surface */}
      <main className="w-full max-w-[640px] bg-[#FDFBF7] min-h-[80vh] px-16 py-24 mb-32 shadow-[0_4px_40px_rgba(0,0,0,0.02)] rounded-sm relative">
        <h1 className="text-5xl font-normal text-charcoal mb-16 leading-tight">
          {text?.title}
        </h1>
        
        <div 
          ref={textRef}
          onMouseUp={handleMouseUp}
          className="text-xl leading-[1.8] text-charcoal/90 whitespace-pre-wrap selection:bg-terracotta/20 cursor-text font-light"
        >
          {renderTextWithHighlights()}
        </div>

        {/* Floating Palette */}
        {selection && (
          <div 
            className="fixed z-40 transform -translate-x-1/2 -translate-y-[110%] animate-in fade-in zoom-in duration-300"
            style={{ 
              top: selection.rect.top + window.scrollY, 
              left: selection.rect.left + (selection.rect.width / 2) 
            }}
          >
            <GlassCard className="w-[200px] p-2 flex flex-col shadow-2xl border-white/60">
              <div className="flex flex-col">
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
                      
                      {/* Custom Tooltip implementation if needed, but 'title' is a simple fallback */}
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
      </main>
    </div>
  )
}
