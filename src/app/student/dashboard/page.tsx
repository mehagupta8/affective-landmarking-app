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
  Plus,
  Sparkles
} from 'lucide-react'
import { Text, Class, Annotation, StudentProfile, ClassEnrollment, WritingSubmission } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { Orb } from '@/components/ui/Orb'
import { cn } from '@/lib/utils'

type EnrolledClass = Class & { enrollment: ClassEnrollment }

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [texts, setTexts] = useState<Text[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [writingSubmissions, setWritingSubmissions] = useState<WritingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/student/login'); return }

    const { data: prof } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!prof) { router.push('/student/login'); return }
    setProfile(prof)

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('*, classes(*)')
      .eq('student_id', user.id)
      .order('joined_at', { ascending: false })

    if (!enrollments || enrollments.length === 0) {
      setLoading(false)
      setShowJoin(true)
      return
    }

    const classes: EnrolledClass[] = enrollments.map((e: any) => ({
      ...e.classes,
      enrollment: { id: e.id, student_id: e.student_id, class_id: e.class_id, joined_at: e.joined_at, last_active_at: e.last_active_at, submitted_texts: e.submitted_texts }
    }))
    setEnrolledClasses(classes)

    const activeId = selectedClassId || classes[0].id
    setSelectedClassId(activeId)
    await loadClassData(user.id, activeId, enrollments.find((e: any) => e.class_id === activeId))
    setLoading(false)
  }, [selectedClassId, router])

  const loadClassData = async (userId: string, classId: string, enrollment: any) => {
    const [textsRes, annRes, writingRes] = await Promise.all([
      supabase.from('texts').select('*').eq('class_id', classId).order('created_at', { ascending: false }),
      supabase.from('annotations').select('*').eq('student_id', userId),
      supabase.from('writing_submissions').select('*').eq('student_id', userId)
    ])
    setTexts(textsRes.data || [])
    setAnnotations(annRes.data || [])
    setWritingSubmissions(writingRes.data || [])
  }

  useEffect(() => { void fetchData() }, [])

  const handleJoinClass = async () => {
    setJoining(true)
    setJoinError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: cls, error } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', classCode.trim().toUpperCase())
      .single()

    if (error || !cls) {
      setJoinError('Invalid class code. Check with your teacher.')
      setJoining(false)
      return
    }

    const { error: enrollError } = await supabase
      .from('class_enrollments')
      .insert({ student_id: user.id, class_id: cls.id })

    if (enrollError) {
      setJoinError(enrollError.code === '23505' ? 'You are already enrolled in this class.' : enrollError.message)
      setJoining(false)
      return
    }

    setClassCode('')
    setShowJoin(false)
    setSelectedClassId(cls.id)
    void fetchData()
    setJoining(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/student/login')
  }

  const calculateProgress = (text: Text) => {
    const textAnns = annotations.filter(a => a.text_id === text.id)
    if (!text || text.content.length === 0) return 0
    const intervals = textAnns.map(a => [a.start_offset, a.end_offset]).sort((a, b) => a[0] - b[0])
    if (intervals.length === 0) return 0
    const merged = [[...intervals[0]]]
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1]
      const curr = intervals[i]
      if (curr[0] <= prev[1]) prev[1] = Math.max(prev[1], curr[1])
      else merged.push([...curr])
    }
    const totalCovered = merged.reduce((acc, [s, e]) => acc + (e - s), 0)
    return Math.min(100, Math.round((totalCovered / text.content.length) * 100))
  }

  const selectedClass = enrolledClasses.find(c => c.id === selectedClassId)

  if (loading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  // No classes yet — show join form
  if (showJoin && enrolledClasses.length === 0) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-12 shadow-2xl border-white/40 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <Orb size="md" className="mb-6" />
            <h1 className="text-3xl font-normal text-charcoal">Join a Class</h1>
            <p className="text-warm-grey text-base mt-2 font-light">Enter the class code from your teacher.</p>
          </div>
          {joinError && (
            <div className="bg-red-50/30 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm mb-6 text-center">
              {joinError}
            </div>
          )}
          <div className="space-y-6">
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="w-full text-center text-4xl font-mono tracking-[0.4em] px-4 py-6 bg-white/30 border-none rounded-[28px] focus:ring-2 focus:ring-terracotta/20 outline-none uppercase placeholder:text-warm-grey/10 text-charcoal"
              placeholder="------"
              maxLength={6}
            />
            <PillButton
              onClick={handleJoinClass}
              disabled={joining || classCode.length < 6}
              className="w-full py-5 text-xl flex items-center justify-center gap-3"
            >
              {joining ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Join Class'}
              <ArrowRight className="w-6 h-6" />
            </PillButton>
          </div>
          <button onClick={handleLogout} className="mt-8 w-full text-center text-sm text-warm-grey/40 hover:text-charcoal transition-colors">
            Sign out
          </button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen atmospheric-bg py-12 px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Orb size="sm" />
              <span className="text-[12px] font-black text-terracotta uppercase tracking-[0.3em]">Student Portal</span>
            </div>
            <h1 className="text-6xl font-normal text-charcoal">
              Welcome, {profile?.first_name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="glass bg-white/40 hover:bg-white/60 px-5 py-3 rounded-full text-sm font-medium text-charcoal transition-all border border-white/60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Join Another Class
            </button>
            <button
              onClick={handleLogout}
              className="glass bg-white/40 hover:bg-white/60 p-3 rounded-full text-warm-grey hover:text-charcoal transition-all border border-white/60 group"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>

        {/* Join class inline panel */}
        {showJoin && (
          <GlassCard className="p-8 border-white/40 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl text-charcoal mb-4">Join Another Class</h2>
            {joinError && <p className="text-red-500 text-sm mb-4">{joinError}</p>}
            <div className="flex gap-4">
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="flex-1 text-center text-2xl font-mono tracking-[0.4em] px-4 py-4 bg-white/30 border-none rounded-[28px] focus:ring-2 focus:ring-terracotta/20 outline-none uppercase placeholder:text-warm-grey/10 text-charcoal"
                placeholder="------"
                maxLength={6}
              />
              <PillButton onClick={handleJoinClass} disabled={joining || classCode.length < 6} className="px-8 py-4">
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
              </PillButton>
              <button onClick={() => { setShowJoin(false); setClassCode(''); setJoinError(null) }} className="px-4 text-warm-grey hover:text-charcoal transition-colors">
                Cancel
              </button>
            </div>
          </GlassCard>
        )}

        {/* Class tabs if multiple */}
        {enrolledClasses.length > 1 && (
          <div className="flex gap-3 flex-wrap">
            {enrolledClasses.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                  selectedClassId === cls.id
                    ? "bg-terracotta text-white border-terracotta shadow-sm"
                    : "glass bg-white/40 text-charcoal border-white/60 hover:bg-white/60"
                )}
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Text list */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl text-charcoal font-light">
                {selectedClass?.name || 'Class Library'}
              </h2>
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
                  const enrollment = selectedClass?.enrollment
                  const isSubmitted = enrollment?.submitted_texts?.includes(text.id)
                  const hasWriting = writingSubmissions.find(s => s.text_id === text.id)
                  const isPastDeadline = text.due_date && new Date(text.due_date) < new Date()

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
                              <Link href={`/annotate/${text.id}/spectrum`}>
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
                            <Link href={`/annotate/${text.id}`}>
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

          {/* Sidebar */}
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-normal text-charcoal uppercase tracking-[0.2em]">Profile</h2>
              <GlassCard className="p-8 space-y-6 border-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta/20 to-terracotta/5 flex items-center justify-center text-terracotta border border-terracotta/10">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg text-charcoal font-medium">{profile?.first_name} {profile?.last_name}</span>
                    <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest">Student</span>
                  </div>
                </div>
                <div className="h-px bg-charcoal/5" />
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-grey">Classes enrolled</span>
                    <span className="text-charcoal font-medium">{enrolledClasses.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-grey">Overall progress</span>
                    <span className="text-charcoal font-medium">
                      {texts.length > 0 ? Math.round(texts.reduce((acc, t) => acc + calculateProgress(t), 0) / texts.length) : 0}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            </section>

            {selectedClass?.due_date && (
              <section className="space-y-6">
                <h2 className="text-xl font-normal text-charcoal uppercase tracking-[0.2em]">Schedule</h2>
                <GlassCard className="p-8 border-white/40 bg-white/20">
                  <div className="flex items-center gap-4 text-charcoal mb-4">
                    <Calendar className="w-5 h-5 text-terracotta/60" />
                    <span className="text-sm font-medium uppercase tracking-widest">Class Deadline</span>
                  </div>
                  <p className="text-2xl font-light text-charcoal">
                    {new Date(selectedClass.due_date).toLocaleDateString()}
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
