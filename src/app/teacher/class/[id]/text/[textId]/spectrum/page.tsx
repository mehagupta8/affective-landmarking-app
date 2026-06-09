'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BarChart2, Loader2, Info } from 'lucide-react'
import { Class, Text, Student, Annotation } from '@/types/database'
import SpectrumVisualizer from '@/components/viz/SpectrumVisualizer'
import { GlassCard } from '@/components/ui/GlassCard'

export default function SpectrumPage({ params }: { params: Promise<{ id: string, textId: string }> }) {
  const { id: classId, textId } = use(params)
  const [cls, setCls] = useState<Class | null>(null)
  const [text, setText] = useState<Text | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  const fetchSpectrumData = useCallback(async () => {
    try {
      let { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession()
        user = session?.user || null
      }
      if (!user) {
        router.push('/teacher/login')
        return
      }

      const [classRes, textRes, studentsRes, annRes] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('texts').select('*').eq('id', textId).single(),
        supabase.from('students').select('*').eq('class_id', classId),
        supabase.from('annotations').select('*').eq('text_id', textId)
      ])

      if (classRes.error || textRes.error) {
        router.push(`/teacher/class/${classId}`)
        return
      }

      setCls(classRes.data)
      setText(textRes.data)
      setStudents(studentsRes.data || [])
      setAnnotations(annRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [classId, textId, router])

  useEffect(() => {
    void fetchSpectrumData() // eslint-disable-line react-hooks/set-state-in-effect
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
            Spectrum: {text.title}
          </h1>
          <p className="text-warm-grey text-xl font-light">{cls.name}</p>
        </div>

        <div className="flex items-center gap-4 glass bg-white/40 px-6 py-3 rounded-full border-white/60 shadow-sm">
          <BarChart2 className="w-5 h-5 text-terracotta" />
          <span className="text-sm font-bold text-charcoal uppercase tracking-widest">{annotations.length} Annotations</span>
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
        <SpectrumVisualizer 
          text={text.content}
          annotations={annotations}
          students={students}
          title={text.title}
        />
      )}
    </div>
  )
}
