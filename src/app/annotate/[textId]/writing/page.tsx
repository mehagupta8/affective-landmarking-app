'use client'

import React, { useState, useEffect, useCallback, use, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Loader2, 
  Send, 
  Sparkles, 
  MousePointer2, 
  CheckCircle2,
  BookOpen,
  Quote,
  RefreshCw
} from 'lucide-react'
import { Text, Annotation, StudentProfile, EmotionLabel, EMOTION_CONFIGS } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { cn } from '@/lib/utils'

export default function WritingActivityPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const [text, setText] = useState<Text | null>(null)
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Activity State
  const [step, setStep] = useState<'selection' | 'drafting' | 'success'>('selection')
  const [promptType, setPromptType] = useState<'choice' | 'random' | null>(null)
  const [selectedAnns, setSelectedAnns] = useState<Annotation[]>([])
  const [randomEmotion, setRandomEmotion] = useState<EmotionLabel | null>(null)
  const [writingContent, setWritingContent] = useState('')

  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/student/login'); return }

      const { data: prof } = await supabase
        .from('student_profiles').select('*').eq('id', user.id).single()
      if (!prof) { router.push('/student/login'); return }
      setStudent(prof)

      const [textRes, annRes, subRes] = await Promise.all([
        supabase.from('texts').select('*').eq('id', textId).single(),
        supabase.from('annotations').select('*').eq('text_id', textId).eq('student_id', user.id),
        supabase.from('writing_submissions').select('*').eq('text_id', textId).eq('student_id', user.id).single()
      ])

      if (subRes.data) setStep('success')
      setText(textRes.data)
      setAnnotations(annRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [textId, router])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleRandomize = () => {
    const usedEmotions = Array.from(new Set(annotations.map(a => a.rasa_label)))
    const pool = usedEmotions.length > 0 ? usedEmotions : (Object.keys(EMOTION_CONFIGS) as EmotionLabel[])
    const random = pool[Math.floor(Math.random() * pool.length)]
    setRandomEmotion(random)
    setPromptType('random')
    // Find annotations for this random emotion if any
    const matches = annotations.filter(a => a.rasa_label === random)
    setSelectedAnns(matches.slice(0, 2))
    setStep('drafting')
  }

  const handleSelectOwn = (ann: Annotation) => {
    if (selectedAnns.find(a => a.id === ann.id)) {
      setSelectedAnns(selectedAnns.filter(a => a.id !== ann.id))
    } else {
      if (selectedAnns.length < 5) {
        setSelectedAnns([...selectedAnns, ann])
      }
    }
  }

  const handleSubmitWriting = async () => {
    if (!student || !textId || !writingContent.trim()) return
    setSubmitting(true)

    const { error } = await supabase
      .from('writing_submissions')
      .insert([{
        text_id: textId,
        student_id: student.id,
        content: writingContent.trim(),
        prompt_type: promptType,
        selected_emotion: randomEmotion,
        selected_annotation_ids: selectedAnns.map(a => a.id)
      }])

    if (!error) {
      setStep('success')
    } else {
      alert('Error submitting your response. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  if (!text || !student) return null

  return (
    <div className="min-h-screen atmospheric-bg py-12 px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-12">
        <header className="flex justify-between items-center">
          <Link 
            href="/student/dashboard" 
            className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Phase 02</span>
            <div className="h-px w-8 bg-terracotta/20" />
            <span className="text-[10px] font-bold text-charcoal uppercase tracking-[0.2em]">Writing Activity</span>
          </div>
        </header>

        {step === 'selection' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-normal text-charcoal">Deepen your Landmark.</h1>
              <p className="text-warm-grey text-xl font-light">Choose how you want to approach your analysis of &quot;{text.title}&quot;.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GlassCard className="p-10 flex flex-col items-center text-center space-y-6 hover:-translate-y-1 transition-all duration-500 group border-white/40">
                <div className="w-16 h-16 rounded-3xl bg-terracotta/5 flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform">
                  <MousePointer2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl text-charcoal">Choose Your Moment</h3>
                  <p className="text-sm text-warm-grey leading-relaxed">
                    Select up to five of your own highlights to analyze. Pick segments that felt particularly resonant or confusing.
                  </p>
                </div>
                <div className="w-full pt-4">
                  <div className="max-h-[300px] overflow-y-auto space-y-3 mb-6 p-2 scrollbar-thin scrollbar-thumb-charcoal/5">
                    {annotations.length === 0 ? (
                      <p className="text-xs text-warm-grey italic">No highlights found for this text.</p>
                    ) : (
                      annotations.map(ann => (
                        <button
                          key={ann.id}
                          onClick={() => handleSelectOwn(ann)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all text-xs leading-relaxed font-serif italic",
                            selectedAnns.find(a => a.id === ann.id)
                              ? "bg-white border-terracotta shadow-md text-charcoal"
                              : "bg-white/30 border-white/60 text-charcoal/60 hover:bg-white/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMOTION_CONFIGS[ann.rasa_label].color }} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{EMOTION_CONFIGS[ann.rasa_label].name}</span>
                          </div>
                          &quot;{text.content.substring(ann.start_offset, ann.end_offset).substring(0, 120)}...&quot;
                        </button>
                      ))
                    )}
                  </div>
                  <PillButton 
                    disabled={selectedAnns.length === 0}
                    onClick={() => { setPromptType('choice'); setStep('drafting'); }}
                    className="w-full py-4"
                  >
                    Start Analysis ({selectedAnns.length})
                  </PillButton>
                </div>
              </GlassCard>

              <GlassCard className="p-10 flex flex-col items-center text-center space-y-6 hover:-translate-y-1 transition-all duration-500 group border-white/40 bg-terracotta/[0.02]">
                <div className="w-16 h-16 rounded-3xl bg-terracotta/10 flex items-center justify-center text-terracotta group-hover:rotate-12 transition-transform">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl text-charcoal">Random Affect</h3>
                  <p className="text-sm text-warm-grey leading-relaxed">
                    Let the app pick an emotion for you. You&apos;ll write about a moment where you felt this emotion (or why you didn&apos;t feel it).
                  </p>
                </div>
                <div className="flex-1" />
                <PillButton 
                  onClick={handleRandomize}
                  className="w-full py-4 flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  Spin the Emotion Wheel
                </PillButton>
              </GlassCard>
            </div>
          </div>
        )}

        {step === 'drafting' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
              <h2 className="text-4xl font-normal text-charcoal">Close Reading</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-warm-grey">Writing through the lens of</span>
                {promptType === 'random' ? (
                  <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-charcoal/5 shadow-sm text-sm font-bold text-charcoal">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMOTION_CONFIGS[randomEmotion!].color }} />
                    {EMOTION_CONFIGS[randomEmotion!].name}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-charcoal">Your Selection</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Reference Segments</h3>
                <div className="space-y-4">
                  {selectedAnns.length > 0 ? (
                    selectedAnns.map(ann => (
                      <div key={ann.id} className="bg-white/40 p-6 rounded-3xl border border-white/60 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: EMOTION_CONFIGS[ann.rasa_label].color }} />
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-charcoal/40">{EMOTION_CONFIGS[ann.rasa_label].name}</span>
                        </div>
                        <p className="text-sm text-charcoal leading-relaxed font-serif italic">
                          &quot;{text.content.substring(ann.start_offset, ann.end_offset)}&quot;
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-charcoal/5 p-6 rounded-3xl border border-charcoal/5 text-center py-12">
                      <Quote className="w-8 h-8 text-warm-grey/20 mx-auto mb-4" />
                      <p className="text-xs text-warm-grey italic">No existing highlights for this emotion. Look back at the text to find a relevant moment.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Your Reflection</h3>
                </div>
                <textarea
                  value={writingContent}
                  onChange={(e) => setWritingContent(e.target.value)}
                  placeholder="Type your close reading here..."
                  className="w-full min-h-[400px] p-10 bg-white shadow-xl rounded-[40px] border-none focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal leading-relaxed font-serif selection:bg-terracotta/10"
                />
                <div className="flex justify-between items-center pt-4">
                  <button 
                    onClick={() => setStep('selection')}
                    className="text-sm text-warm-grey hover:text-charcoal transition-colors font-medium"
                  >
                    Change Prompt
                  </button>
                  <PillButton 
                    disabled={submitting || !writingContent.trim()}
                    onClick={handleSubmitWriting}
                    className="px-12 py-4 flex items-center gap-3"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Submit Response
                  </PillButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="animate-in zoom-in fade-in duration-700 flex flex-col items-center py-20">
            <GlassCard className="max-w-md w-full p-12 text-center space-y-8 border-white/60 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-terracotta" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl text-charcoal font-normal">Reflection Complete</h2>
                <p className="text-warm-grey text-base font-light">
                  You have successfully bridged the gap between feeling and analysis.
                </p>
              </div>
              <Link href="/student/dashboard" className="block w-full">
                <PillButton className="w-full py-4 flex items-center justify-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  Return to Dashboard
                </PillButton>
              </Link>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}
