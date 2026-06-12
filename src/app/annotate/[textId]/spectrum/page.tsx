'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Users } from 'lucide-react'
import { Text, Annotation, Student } from '@/types/database'
import SpectrumVisualizer from '@/components/viz/SpectrumVisualizer'

export default function StudentSpectrumPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = use(params)
  const [text, setText] = useState<Text | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
        <header className="space-y-6">
          <Link 
            href="/join" 
            className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Library
          </Link>
          <div className="space-y-2">
            <h1 className="text-5xl font-normal text-charcoal">{text.title}</h1>
            <div className="flex items-center gap-2 text-warm-grey/60 font-medium uppercase tracking-[0.2em] text-[10px]">
              <Users className="w-3 h-3" />
              Class Consolidated Spectrum
            </div>
          </div>
        </header>

        <SpectrumVisualizer 
          text={text.content}
          annotations={annotations}
          students={students}
        />
      </div>
    </div>
  )
}
