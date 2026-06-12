'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Loader2, 
  TrendingUp, 
  BarChart2, 
  Calendar,
  User,
  LogOut,
  ChevronRight,
  ArrowRight,
  Mail
} from 'lucide-react'
import { Text, Class, Annotation, Student } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { cn } from '@/lib/utils'

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null)
  const [cls, setCls] = useState<Class | null>(null)
  const [texts, setTexts] = useState<Text[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      // 1. Get current student from session
      const meRes = await fetch('/api/student/me')
      if (!meRes.ok) {
        router.push('/join')
        return
      }
      const meData = await meRes.json()
      setStudent(meData)

      // 2. Fetch Class, Texts, Annotations, and Writing Submissions
      const [classRes, textsRes, annRes, writingRes] = await Promise.all([
        supabase.from('classes').select('*').eq('id', meData.class_id).single(),
        supabase.from('texts').select('*').eq('class_id', meData.class_id).order('created_at', { ascending: false }),
        supabase.from('annotations').select('*').eq('student_id', meData.id),
        supabase.from('writing_submissions').select('*').eq('student_id', meData.id)
      ])

      if (classRes.data) setCls(classRes.data)
      if (textsRes.data) setTexts(textsRes.data)
      if (annRes.data) setAnnotations(annRes.data)
      if (writingRes.data) setWritingSubmissions(writingRes.data)

    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const calculateProgress = (text: Text) => {
    const textAnns = annotations.filter(a => a.text_id === text.id)
    if (!text || text.content.length === 0) return 0
    
    const intervals = textAnns
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
  }

  const handleLogout = async () => {
    await fetch('/api/student/auth', { method: 'DELETE' })
    router.push('/join')
  }

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  if (!student || !cls) return null

  return (
    <div className="min-h-screen atmospheric-bg py-12 px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Orb size="sm" className="shadow-[0_0_20px_rgba(232,155,108,0.3)]" />
              <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.3em]">Student Portal</span>
            </div>
            <h1 className="text-5xl font-normal text-charcoal">Welcome, {student.name}</h1>
            <div className="flex flex-wrap gap-4 items-center">
              <span className="glass bg-white/60 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] text-charcoal/60 uppercase border-white/80 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-terracotta/40" />
                {cls.name}
              </span>
              <span className="glass bg-white/60 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] text-terracotta uppercase border-white/80">
                CODE: {cls.class_code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={handleLogout}
                className="glass bg-white/40 hover:bg-white/60 p-3 rounded-full text-warm-grey hover:text-charcoal transition-all border border-white/60 group"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl text-charcoal font-light">Class Library</h2>
              <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest">{texts.length} Assignments</span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {texts.length === 0 ? (
                <GlassCard className="py-24 text-center border-dashed border-2 border-white/30 bg-white/10">
                  <p className="text-warm-grey text-xl font-light">No texts assigned yet.</p>
                </GlassCard>
              ) : (
                texts.map((text) => {
                  const progress = calculateProgress(text)
                  const isSubmitted = student.submitted_texts?.includes(text.id)
                  const hasWriting = writingSubmissions.find(s => s.text_id === text.id)
                  const isPastDeadline = text.due_date && new Date(text.due_date) < new Date()
                  const isLocked = isSubmitted || isPastDeadline

                  return (
                    <GlassCard key={text.id} className="p-8 group hover:-translate-y-1 transition-all duration-500 shadow-sm border-white/40 overflow-hidden relative">
                      {isSubmitted && (
                        <div className="absolute top-0 right-0 bg-terracotta text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow-sm z-10">
                          Submitted
                        </div>
                      )}
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4 flex-1">
                          <div className="space-y-1">
                            <h3 className="text-2xl text-charcoal group-hover:text-terracotta transition-colors duration-500">{text.title}</h3>
                            {text.author && <p className="text-sm text-warm-grey/60 italic font-serif">by {text.author}</p>}
                          </div>

                          <div className="flex flex-wrap gap-4 items-center">
                            {text.due_date && (
                              <div className={cn(
                                "flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full border w-fit",
                                isPastDeadline ? "bg-red-50 text-red-500 border-red-100" : "bg-terracotta/5 text-terracotta/80 border-terracotta/10"
                              )}>
                                <Calendar className="w-3 h-3" />
                                {isPastDeadline ? 'CLOSED' : `DUE: ${new Date(text.due_date).toLocaleDateString()}`}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest">
                              <TrendingUp className="w-3 h-3" />
                              {progress}% Complete
                            </div>
                          </div>
                          
                          <div className="h-1.5 w-full max-w-md bg-charcoal/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-terracotta transition-all duration-1000 ease-out"
                              style={{ width: `${progress}%`, opacity: 0.3 + (progress / 100) * 0.7 }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isSubmitted ? (
                            <div className="flex flex-col gap-2">
                              <Link href={`/annotate/${text.id}/spectrum?student=${student.id}`}>
                                <PillButton className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-white text-charcoal border border-charcoal/5 shadow-sm">
                                  <BarChart2 className="w-4 h-4" />
                                  Class Spectrum
                                </PillButton>
                              </Link>
                              <Link href={`/annotate/${text.id}/writing`}>
                                <PillButton className="w-full flex items-center justify-center gap-2 px-8 py-3">
                                  <Sparkles className="w-4 h-4" />
                                  {hasWriting ? 'View Reflection' : 'Writing Activity'}
                                  <ArrowRight className="w-4 h-4" />
                                </PillButton>
                              </Link>
                            </div>
                          ) : (
                            <Link href={`/annotate/${text.id}?student=${student.id}`}>
                              <PillButton className="flex items-center gap-2 px-10 py-4">
                                {progress > 0 ? 'Resume' : 'Start'}
                                <ArrowRight className="w-4 h-4" />
                              </PillButton>
                            </Link>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  )
                })
              )}
            </div>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-normal text-charcoal uppercase tracking-[0.2em]">Profile Info</h2>
              <GlassCard className="p-8 space-y-6 border-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta/20 to-terracotta/5 flex items-center justify-center text-terracotta border border-terracotta/10">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg text-charcoal font-medium">{student.name}</span>
                    <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest">Student Account</span>
                  </div>
                </div>

                <div className="h-px bg-charcoal/5" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-grey">Linked Login</span>
                    {student.auth_user_id ? (
                      <div className="flex items-center gap-2 text-terracotta font-medium">
                        <Mail className="w-3 h-3" />
                        Google
                      </div>
                    ) : (
                      <span className="text-charcoal/40 italic">PIN Only</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-grey">Total Progress</span>
                    <span className="text-charcoal font-medium">
                      {texts.length > 0 
                        ? Math.round(texts.reduce((acc, t) => acc + calculateProgress(t), 0) / texts.length) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            </section>

            {cls.due_date && (
              <section className="space-y-6">
                <h2 className="text-xl font-normal text-charcoal uppercase tracking-[0.2em]">Class Schedule</h2>
                <GlassCard className="p-8 border-white/40 bg-white/20">
                  <div className="flex items-center gap-4 text-charcoal mb-4">
                    <Calendar className="w-5 h-5 text-terracotta/60" />
                    <span className="text-sm font-medium uppercase tracking-widest">Main Course Deadline</span>
                  </div>
                  <p className="text-2xl font-light text-charcoal mb-2">
                    {new Date(cls.due_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-warm-grey font-light">
                    Assignments may have individual deadlines. Check each text card for details.
                  </p>
                </GlassCard>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
