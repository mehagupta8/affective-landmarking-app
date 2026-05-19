'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BarChart2, Loader2, Info } from 'lucide-react'
import { Class, Text, Student, Annotation } from '@/types/database'
import SpectrumVisualizer from '@/components/viz/SpectrumVisualizer'

export default function SpectrumPage({ params }: { params: Promise<{ id: string, textId: string }> }) {
  const { id: classId, textId } = use(params)
  const [cls, setCls] = useState<Class | null>(null)
  const [text, setText] = useState<Text | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    fetchSpectrumData()
  }, [classId, textId])

  const fetchSpectrumData = async () => {
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
        console.error('Error fetching data')
        router.push(`/teacher/class/${classId}`)
        return
      }

      setCls(classRes.data)
      setText(textRes.data)
      setStudents(studentsRes.data || [])
      setAnnotations(annRes.data || [])
    } catch (err) {
      console.error('Unexpected spectrum data error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!cls || !text) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/teacher/class/${classId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="font-bold text-xl text-gray-900 leading-tight">Spectrum: {text.title}</h1>
              <p className="text-xs text-gray-400 font-medium">{cls.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">{annotations.length} Annotations</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {annotations.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No data yet</h2>
            <p className="text-gray-500 mb-8">
              Students haven't added any annotations to this text yet. Share the class code with them to start collecting data.
            </p>
            <div className="inline-block bg-purple-100 px-6 py-3 rounded-2xl border border-purple-200">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">Class Code</span>
              <span className="text-3xl font-mono font-black text-purple-700 uppercase tracking-[0.2em]">{cls.class_code}</span>
            </div>
          </div>
        ) : (
          <SpectrumVisualizer 
            text={text.content}
            annotations={annotations}
            students={students}
            title={text.title}
          />
        )}
      </main>
    </div>
  )
}
