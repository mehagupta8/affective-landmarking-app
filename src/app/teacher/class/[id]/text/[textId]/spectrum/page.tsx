'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BarChart2, Loader2, Info, PieChart, Layout, Quote, MessageSquare } from 'lucide-react'
import { Class, Text, Student, Annotation, WritingSubmission, RASA_CONFIGS } from '@/types/database'
import SpectrumVisualizer from '@/components/viz/SpectrumVisualizer'
import StatsDashboard from '@/components/viz/StatsDashboard'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'

export default function SpectrumPage({ params }: { params: Promise<{ id: string, textId: string }> }) {
  const { id: classId, textId } = use(params)
  const [cls, setCls] = useState<Class | null>(null)
  const [text, setText] = useState<Text | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'spectrum' | 'stats' | 'reflections'>('spectrum')

  const router = useRouter()

  const fetchSpectrumData = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      let user = userData?.user
      if (!user) {
        const { data: sessionData } = await supabase.auth.getSession()
        user = sessionData?.session?.user || null
      }
      if (!user) {
        router.push('/teacher/login')
        return
      }

      const [classRes, textRes, studentsRes, annRes, writingRes] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('texts').select('*').eq('id', textId).single(),
        supabase.from('students').select('*').eq('class_id', classId),
        supabase.from('annotations').select('*').eq('text_id', textId),
        supabase.from('writing_submissions').select('*').eq('text_id', textId)
      ])

      if (classRes.error || textRes.error) {
        router.push(`/teacher/class/${classId}`)
        return
      }

      setCls(classRes.data)
      setText(textRes.data)
      setStudents(studentsRes.data || [])
      setAnnotations(annRes.data || [])
      setWritingSubmissions(writingRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [classId, textId, router])

  useEffect(() => {
    void fetchSpectrumData()
  }, [fetchSpectrumData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
      </div>
    )
  }

  if (!cls || !text) return null

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <Link 
            href={`/teacher/class/${classId}`} 
            className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors text-sm mb-4"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Class
          </Link>
          <h1 className="text-5xl font-normal text-charcoal">
            {view === 'spectrum' ? 'Spectrum' : 'Analytics'}: {text.title}
          </h1>
          <p className="text-warm-grey text-xl font-light">{cls.name}</p>
        </div>

        <div className="flex bg-white/30 p-1.5 rounded-full border border-white/40 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setView('spectrum')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
              view === 'spectrum' ? "bg-white text-charcoal shadow-md" : "text-warm-grey/60 hover:text-charcoal"
            )}
          >
            <Layout className="w-4 h-4" />
            Visual
          </button>
          <button
            onClick={() => setView('stats')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
              view === 'stats' ? "bg-white text-charcoal shadow-md" : "text-warm-grey/60 hover:text-charcoal"
            )}
          >
            <PieChart className="w-4 h-4" />
            Insights
          </button>
          <button
            onClick={() => setView('reflections')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-widest rounded-full transition-all",
              view === 'reflections' ? "bg-white text-charcoal shadow-md" : "text-warm-grey/60 hover:text-charcoal"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Reflections
          </button>
        </div>
      </header>

      {annotations.length === 0 ? (
        <GlassCard className="py-32 text-center border-dashed border-2 border-white/30 bg-white/10 max-w-3xl mx-auto">
          <div className="bg-white/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm backdrop-blur-sm">
            <Info className="w-12 h-12 text-warm-grey/40" />
          </div>
          <h3 className="text-3xl text-charcoal font-light mb-4">No data yet</h3>
          <p className="text-warm-grey text-lg mb-10 max-w-md mx-auto">
            Students haven&apos;t added any annotations to this text yet. Share the code to begin.
          </p>
          <div className="inline-flex flex-col items-center glass bg-white/60 px-10 py-6 rounded-[28px] border-white/80 shadow-md">
            <span className="text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em] mb-2">Class Code</span>
            <span className="text-4xl font-mono font-black text-charcoal uppercase tracking-[0.3em]">{cls.class_code}</span>
          </div>
        </GlassCard>
      ) : (
        <div className="animate-in fade-in duration-700">
          {view === 'spectrum' ? (
            <SpectrumVisualizer 
              text={text.content}
              annotations={annotations}
              students={students}
              title={text.title}
            />
          ) : view === 'stats' ? (
            <StatsDashboard 
              text={text.content}
              annotations={annotations}
              studentCount={students.length}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {writingSubmissions.length === 0 ? (
                <GlassCard className="py-24 text-center border-dashed border-2 border-white/30 bg-white/10">
                  <p className="text-warm-grey text-xl font-light">No student reflections submitted yet.</p>
                </GlassCard>
              ) : (
                writingSubmissions.map((sub) => {
                  const student = students.find(s => s.id === sub.student_id)
                  const subAnns = annotations.filter(a => sub.selected_annotation_ids?.includes(a.id))
                  
                  return (
                    <GlassCard key={sub.id} className="p-10 flex flex-col lg:flex-row gap-12 border-white/40 shadow-md">
                      <div className="lg:w-1/3 space-y-6">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-terracotta uppercase tracking-widest">Student</span>
                          <h3 className="text-2xl text-charcoal">{student?.name || 'Unknown Student'}</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <span className="text-[10px] font-black text-warm-grey/40 uppercase tracking-widest">Reference Point</span>
                          {sub.selected_emotion ? (
                            <div className="bg-white/40 p-4 rounded-2xl border border-white/60">
                               <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RASA_CONFIGS[sub.selected_emotion].color }} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">{RASA_CONFIGS[sub.selected_emotion].name}</span>
                              </div>
                              <p className="text-xs text-warm-grey leading-relaxed">Analyzing through the lens of {RASA_CONFIGS[sub.selected_emotion].name}.</p>
                            </div>
                          ) : subAnns.length > 0 ? (
                            subAnns.map(ann => (
                              <div key={ann.id} className="bg-white/40 p-4 rounded-2xl border border-white/60 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: RASA_CONFIGS[ann.rasa_label].color }} />
                                <p className="text-xs text-charcoal leading-relaxed font-serif italic">
                                  &quot;{text.content.substring(ann.start_offset, ann.end_offset)}&quot;
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-warm-grey italic">Generic reflection on overall atmosphere.</p>
                          )}
                        </div>
                      </div>

                      <div className="lg:w-2/3 space-y-4">
                        <div className="flex items-center gap-2 text-warm-grey/40">
                          <Quote className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Analysis</span>
                        </div>
                        <p className="text-lg text-charcoal/90 leading-relaxed font-serif whitespace-pre-wrap">
                          {sub.content}
                        </p>
                        <p className="text-[10px] text-warm-grey/40 pt-4 border-t border-charcoal/5">
                          Submitted {new Date(sub.created_at).toLocaleString()}
                        </p>
                      </div>
                    </GlassCard>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
