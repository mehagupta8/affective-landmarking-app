'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Users, PieChart, Layout } from 'lucide-react'
import { Text, Annotation, Student } from '@/types/database'
import SpectrumVisualizer from '@/components/viz/SpectrumVisualizer'
import StatsDashboard from '@/components/viz/StatsDashboard'
import { cn } from '@/lib/utils'

export default function StudentSpectrumPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const [text, setText] = useState<Text | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'spectrum' | 'stats'>('spectrum')

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch text
      const { data: textData } = await supabase
        .from('texts')
        .select('*')
        .eq('id', textId)
        .single()
      
      if (!textData) return

      // 2. Fetch all annotations and students for this class text
      const [annRes, studentRes] = await Promise.all([
        supabase.from('annotations').select('*').eq('text_id', textId),
        supabase.from('students').select('*').eq('class_id', textData.class_id)
      ])

      setText(textData)
      setAnnotations(annRes.data || [])
      setStudents(studentRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [textId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  if (!text) return null

  return (
    <div className="min-h-screen atmospheric-bg py-12 px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6">
            <Link 
              href="/student/dashboard" 
              className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <div className="space-y-2">
              <h1 className="text-5xl font-normal text-charcoal">{text.title}</h1>
              <div className="flex items-center gap-2 text-warm-grey/60 font-medium uppercase tracking-[0.2em] text-[10px]">
                <Users className="w-3 h-3" />
                Class Consolidated Spectrum
              </div>
            </div>
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
          </div>
        </header>

        <div className="animate-in fade-in duration-700">
          {view === 'spectrum' ? (
            <SpectrumVisualizer 
              text={text.content}
              annotations={annotations}
              students={students}
            />
          ) : (
            <StatsDashboard 
              text={text.content}
              annotations={annotations}
              studentCount={students.length}
            />
          )}
        </div>
      </div>
    </div>
  )
}
