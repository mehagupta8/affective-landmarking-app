'use client'

import { useState, useEffect, use, useCallback, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  BookOpen,
  Users,
  BarChart2,
  Loader2,
  AlertTriangle,
  FileText,
  TrendingUp,
  CheckCircle2,
  Mail,
  Settings,
  Trash2,
  UserMinus,
  UserPlus,
  AlertCircle
} from 'lucide-react'
import { Class, Text, StudentProfile, Annotation } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils'

export default function ClassDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const [cls, setCls] = useState<Class | null>(null)
  const [texts, setTexts] = useState<Text[]>([])
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'texts' | 'students' | 'progress' | 'manage'>('texts')

  // Manage tab state
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null)
  const [deletingClass, setDeletingClass] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [togglingGuests, setTogglingGuests] = useState(false)
  
  // New Text Form State
  const [isAddingText, setIsAddingText] = useState(false)
  const [editingText, setEditingText] = useState<Text | null>(null)
  const [newText, setNewText] = useState({ 
    title: '', 
    author: '',
    source: '',
    content: '', 
    instructions: '',
    trigger_warning: '',
    due_date: ''
  })
  const [savingText, setSavingText] = useState(false)

  const router = useRouter()

  const fetchClassData = useCallback(async () => {
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

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (classError || !classData) {
        router.push('/teacher/dashboard')
        return
      }
      setCls(classData)

      const { data: textsData } = await supabase
        .from('texts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
      setTexts(textsData || [])

      const { data: enrollData } = await supabase
        .from('class_enrollments')
        .select('student_profiles(*)')
        .eq('class_id', classId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setStudents((enrollData || []).map((e: any) => e.student_profiles as StudentProfile).filter(Boolean))

      if (textsData && textsData.length > 0) {
        const textIds = textsData.map(t => t.id)
        const { data: annData } = await supabase
          .from('annotations')
          .select('*')
          .in('text_id', textIds)
        setAnnotations(annData || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [classId, router])

  useEffect(() => {
    void fetchClassData()
  }, [fetchClassData])

  const handleAddText = async (e: FormEvent) => {
    e.preventDefault()
    setSavingText(true)
    
    const textData = { 
      title: newText.title, 
      author: newText.author || null,
      source: newText.source || null,
      content: newText.content, 
      instructions: newText.instructions || null,
      trigger_warning: newText.trigger_warning || null,
      due_date: newText.due_date ? new Date(newText.due_date).toISOString() : null
    }

    if (editingText) {
      const { data, error } = await supabase
        .from('texts')
        .update(textData)
        .eq('id', editingText.id)
        .select()
      
      if (!error && data) {
        setTexts(texts.map(t => t.id === editingText.id ? data[0] : t))
        setEditingText(null)
        setNewText({ title: '', author: '', source: '', content: '', instructions: '', trigger_warning: '', due_date: '' })
        setIsAddingText(false)
      }
    } else {
      const { data, error } = await supabase
        .from('texts')
        .insert([{ ...textData, class_id: classId }])
        .select()
      if (!error && data) {
        setNewText({ title: '', author: '', source: '', content: '', instructions: '', trigger_warning: '', due_date: '' })
        setIsAddingText(false)
        setTexts([data[0], ...texts])
      }
    }
    setSavingText(false)
  }

  const startEditing = (text: Text) => {
    setEditingText(text)
    setNewText({
      title: text.title,
      author: text.author || '',
      source: text.source || '',
      content: text.content,
      instructions: text.instructions || '',
      trigger_warning: text.trigger_warning || '',
      due_date: text.due_date ? new Date(text.due_date).toISOString().slice(0, 16) : ''
    })
    setIsAddingText(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleGuests = async () => {
    if (!cls) return
    setTogglingGuests(true)
    const newVal = !cls.allow_guests
    const { error } = await supabase
      .from('classes')
      .update({ allow_guests: newVal })
      .eq('id', classId)
    if (!error) setCls({ ...cls, allow_guests: newVal })
    setTogglingGuests(false)
  }

  const handleRemoveStudent = async (studentId: string) => {
    setRemovingStudentId(studentId)
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId)

    if (!error) {
      setStudents(students.filter(s => s.id !== studentId))
    }
    setRemovingStudentId(null)
  }

  const handleDeleteClass = async () => {
    setDeletingClass(true)
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (!error) {
      router.push('/teacher/dashboard')
    } else {
      setDeletingClass(false)
      setConfirmDelete(false)
    }
  }

  const calculateStudentProgress = (studentId: string, textId: string) => {
    const studentAnns = annotations.filter(a => a.student_id === studentId && a.text_id === textId)
    const text = texts.find(t => t.id === textId)
    if (!text || text.content.length === 0) return 0

    const intervals = studentAnns
      .map(a => [a.start_offset, a.end_offset])
      .sort((a, b) => a[0] - b[0])

    if (intervals.length === 0) return 0

    const merged = [intervals[0]]
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1]
      const curr = intervals[i]
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1])
      } else {
        merged.push(curr)
      }
    }

    const totalCovered = merged.reduce((acc, [start, end]) => acc + (end - start), 0)
    return Math.min(100, Math.round((totalCovered / text.content.length) * 100))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/40" />
      </div>
    )
  }

  if (!cls) return null

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <Link 
            href="/teacher/dashboard" 
            className="group flex items-center gap-2 text-warm-grey hover:text-charcoal transition-colors text-sm mb-4"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Dashboard
          </Link>
          <h1 className="text-6xl font-normal text-charcoal">
            {cls.name}
          </h1>
          <span className="inline-block glass bg-white/60 px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] text-terracotta uppercase border-white/80">
            CODE: {cls.class_code}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-6 md:gap-10 border-b border-charcoal/5 mb-8">
        {[
          { id: 'texts', label: 'Texts', count: texts.length, icon: BookOpen },
          { id: 'students', label: 'Students', count: students.length, icon: Users },
          { id: 'progress', label: 'Progress', count: students.length, icon: TrendingUp },
          { id: 'manage', label: 'Manage', count: null, icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'texts' | 'students' | 'progress' | 'manage')}
            className={cn(
              "pb-6 px-2 text-lg transition-all relative",
              activeTab === tab.id ? "text-charcoal" : "text-warm-grey hover:text-charcoal opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id && "text-terracotta")} />
              {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-terracotta rounded-full animate-in fade-in duration-500" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'texts' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl text-charcoal font-light">Class Library</h2>
            {!isAddingText && (
              <GlassButton 
                onClick={() => setIsAddingText(true)}
                className="flex items-center gap-2 py-3"
              >
                <Plus className="w-4 h-4" />
                Upload New Text
              </GlassButton>
            )}
          </div>

          {isAddingText && (
            <GlassCard className="p-10 shadow-lg border-white/60 animate-in slide-in-from-top-4 duration-500">
              <h3 className="text-2xl text-charcoal mb-8">{editingText ? 'Edit Text' : 'Add New Text'}</h3>
              <form onSubmit={handleAddText} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm text-charcoal/60 px-2">Title</label>
                    <input
                      type="text"
                      value={newText.title}
                      onChange={(e) => setNewText({ ...newText, title: e.target.value })}
                      className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                      placeholder="The Road Not Taken"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-charcoal/60 px-2">Author</label>
                    <input
                      type="text"
                      value={newText.author}
                      onChange={(e) => setNewText({ ...newText, author: e.target.value })}
                      className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                      placeholder="Robert Frost"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm text-charcoal/60 px-2">Source / Citation</label>
                    <input
                      type="text"
                      value={newText.source}
                      onChange={(e) => setNewText({ ...newText, source: e.target.value })}
                      className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                      placeholder="Mountain Interval (1916)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm text-charcoal/60 px-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-terracotta/60" />
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={newText.due_date}
                      onChange={(e) => setNewText({ ...newText, due_date: e.target.value })}
                      className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-charcoal/60 px-2">Content</label>
                  <textarea
                    value={newText.content}
                    onChange={(e) => setNewText({ ...newText, content: e.target.value })}
                    className="w-full px-8 py-6 bg-white/40 border-none rounded-3xl focus:ring-2 focus:ring-terracotta/20 outline-none min-h-[300px] text-lg text-charcoal leading-relaxed"
                    placeholder="Paste the literary text here..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-charcoal/60 px-2">Special Instructions for Students</label>
                  <textarea
                    value={newText.instructions}
                    onChange={(e) => setNewText({ ...newText, instructions: e.target.value })}
                    className="w-full px-8 py-4 bg-white/40 border-none rounded-3xl focus:ring-2 focus:ring-terracotta/20 outline-none min-h-[100px] text-base text-charcoal leading-relaxed"
                    placeholder="e.g. Focus on the use of 'you' in the second stanza."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-charcoal/60 px-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-terracotta/60" />
                    Trigger Warning (Optional)
                  </label>
                  <input
                    type="text"
                    value={newText.trigger_warning}
                    onChange={(e) => setNewText({ ...newText, trigger_warning: e.target.value })}
                    className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                    placeholder="Depictions of violence"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <GlassButton 
                    type="button"
                    onClick={() => {
                      setIsAddingText(false)
                      setEditingText(null)
                      setNewText({ title: '', author: '', source: '', content: '', instructions: '', trigger_warning: '', due_date: '' })
                    }}
                    className="px-8 border-none hover:bg-red-50/20 hover:text-red-500"
                  >
                    Cancel
                  </GlassButton>
                  <PillButton 
                    type="submit"
                    disabled={savingText}
                    className="px-10 flex items-center gap-3"
                  >
                    {savingText && <Loader2 className="w-5 h-5 animate-spin" />}
                    {editingText ? 'Update Text' : 'Save Text'}
                  </PillButton>
                </div>
              </form>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 gap-6">
            {texts.length === 0 ? (
              <GlassCard className="py-24 text-center border-dashed border-2 border-white/30 bg-white/10">
                <FileText className="w-16 h-16 text-warm-grey/40 mx-auto mb-6" />
                <p className="text-warm-grey text-xl font-light">The library is empty. Upload your first text to begin.</p>
              </GlassCard>
            ) : (
              texts.map((text) => (
                <GlassCard key={text.id} className="p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group hover:-translate-y-1 transition-all duration-500 shadow-sm border-white/40">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-3xl text-charcoal group-hover:text-terracotta transition-colors duration-500">{text.title}</h3>
                      {text.author && <p className="text-lg text-warm-grey/80 font-light">by {text.author}</p>}
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      <p className="text-sm text-warm-grey/60 font-light">
                        Added {new Date(text.created_at).toLocaleDateString()}
                      </p>
                      {text.due_date && (
                        <div className={cn(
                          "flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border",
                          new Date(text.due_date) < new Date() 
                            ? "bg-red-50 text-red-500 border-red-100" 
                            : "bg-terracotta/5 text-terracotta/80 border-terracotta/10"
                        )}>
                          <TrendingUp className="w-3 h-3" />
                          DUE: {new Date(text.due_date).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {text.trigger_warning && (
                      <div className="flex items-center gap-2 text-terracotta/80 text-sm bg-terracotta/5 px-4 py-1.5 rounded-full border border-terracotta/10 w-fit">
                        <AlertTriangle className="w-4 h-4" />
                        TW: {text.trigger_warning}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <GlassButton 
                      onClick={() => startEditing(text)}
                      className="flex items-center gap-2 py-3 px-6"
                    >
                      Edit
                    </GlassButton>
                    <Link 
                      href={`/teacher/class/${cls.id}/text/${text.id}/spectrum`}
                    >
                      <PillButton className="flex items-center gap-3 px-10">
                        <BarChart2 className="w-5 h-5" />
                        View Results
                      </PillButton>
                    </Link>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'students' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <h2 className="text-4xl text-charcoal font-light">Enrolled Students</h2>
          <GlassCard className="p-0 shadow-lg border-white/40 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/60">
                  <th className="px-10 py-6 text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em]">Name</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em]">Joined Date</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em] text-right">Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-10 py-32 text-center text-warm-grey font-light text-xl opacity-60">
                      Waiting for students to enter the shared space.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/30 transition-colors group">
                      <td className="px-10 py-6 text-xl text-charcoal group-hover:text-terracotta transition-colors">{student.first_name} {student.last_name}</td>
                      <td className="px-10 py-6 text-base text-warm-grey/80">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-warm-grey/40 bg-white/40 px-3 py-1 rounded-full border border-white/60">
                          <>
                            <Mail className="w-3 h-3" />
                            Google
                          </>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </GlassCard>
        </div>
      ) : activeTab === 'progress' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl text-charcoal font-light">Engagement Overview</h2>
            <div className="flex items-center gap-4 text-xs font-bold text-warm-grey/60 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-terracotta/20" />
                In Progress
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-terracotta" />
                Completed
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {students.length === 0 ? (
              <GlassCard className="py-24 text-center border-dashed border-2 border-white/30 bg-white/10">
                <Users className="w-16 h-16 text-warm-grey/40 mx-auto mb-6" />
                <p className="text-warm-grey text-xl font-light">No students enrolled yet.</p>
              </GlassCard>
            ) : (
              students.map((student) => (
                <GlassCard key={student.id} className="p-10 shadow-sm border-white/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta/20 to-terracotta/5 flex items-center justify-center text-terracotta font-bold text-xl border border-terracotta/10">
                        {student.first_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl text-charcoal font-normal">{student.first_name} {student.last_name}</h3>
                        <p className="text-sm text-warm-grey/60">Individual annotation metrics</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {texts.map((text) => {
                      const progress = calculateStudentProgress(student.id, text.id)
                      return (
                        <div key={text.id} className="bg-white/30 rounded-2xl p-6 border border-white/40">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-medium text-charcoal/80 line-clamp-1 pr-4">{text.title}</span>
                            {progress === 100 && <CheckCircle2 className="w-4 h-4 text-terracotta shrink-0" />}
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <span className="text-3xl font-light text-charcoal">{progress}%</span>
                              <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-wider mb-1">Coverage</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-terracotta transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(232,155,108,0.4)]"
                                style={{ width: `${progress}%`, opacity: 0.3 + (progress / 100) * 0.7 }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'manage' ? (
        /* ── Manage Tab ───────────────────────────────────────────────── */
        <div className="space-y-10 animate-in fade-in duration-500">

          {/* Guest Access Toggle */}
          <section className="space-y-6">
            <h2 className="text-3xl text-charcoal font-light flex items-center gap-3">
              <Settings className="w-6 h-6 text-terracotta/60" />
              Class Settings
            </h2>
            <GlassCard className="p-8 border-white/40">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-charcoal font-medium flex items-center gap-2">
                    Allow Guest Access
                  </p>
                  <p className="text-warm-grey/70 text-sm">
                    When enabled, anyone with the class code can join as a guest without creating an account — like Kahoot.
                    Guests can annotate and submit, but sessions expire after 24 hours.
                  </p>
                </div>
                <button
                  onClick={handleToggleGuests}
                  disabled={togglingGuests}
                  className={cn(
                    "relative shrink-0 w-14 h-7 rounded-full transition-colors duration-300 disabled:opacity-50",
                    cls?.allow_guests ? "bg-terracotta" : "bg-charcoal/20"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300",
                    cls?.allow_guests ? "translate-x-7" : "translate-x-0"
                  )} />
                </button>
              </div>
              {cls?.allow_guests && (
                <div className="mt-4 pt-4 border-t border-charcoal/5 text-sm text-warm-grey/60">
                  Share code{' '}
                  <span className="font-mono font-bold text-terracotta bg-terracotta/5 px-2 py-0.5 rounded-lg">{cls?.class_code}</span>
                  {' '}and guests can join at{' '}
                  <span className="font-medium text-charcoal/60">/join</span>
                </div>
              )}
            </GlassCard>
          </section>

          {/* Manage Students */}
          <section className="space-y-6">
            <h2 className="text-3xl text-charcoal font-light flex items-center gap-3">
              <Users className="w-6 h-6 text-terracotta/60" />
              Manage Students
            </h2>

            {/* Add student info */}
            <GlassCard className="p-8 border-white/40 space-y-4">
              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-terracotta/60 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-charcoal font-medium">Add a student</p>
                  <p className="text-warm-grey text-sm">
                    Share the class code <span className="font-mono font-bold text-terracotta bg-terracotta/5 px-2 py-0.5 rounded-lg">{cls.class_code}</span> with students. They can join from their dashboard at <span className="font-medium">/student/dashboard</span>.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Enrolled students with remove */}
            <GlassCard className="p-0 border-white/40 overflow-hidden">
              <div className="bg-white/40 border-b border-white/60 px-8 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-warm-grey/60 uppercase tracking-widest">
                  {students.length} Enrolled Student{students.length !== 1 ? 's' : ''}
                </span>
              </div>
              {students.length === 0 ? (
                <div className="px-8 py-16 text-center text-warm-grey font-light opacity-60">
                  No students enrolled yet.
                </div>
              ) : (
                <ul className="divide-y divide-white/20">
                  {students.map(student => (
                    <li key={student.id} className="flex items-center justify-between px-8 py-5 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta font-bold text-sm">
                          {student.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-charcoal font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-warm-grey/50">Joined {new Date(student.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        disabled={removingStudentId === student.id}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-warm-grey/50 hover:text-red-500 hover:bg-red-50/30 rounded-full transition-all disabled:opacity-40"
                      >
                        {removingStudentId === student.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <UserMinus className="w-4 h-4" />
                        }
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </section>

          {/* Danger Zone */}
          <section className="space-y-6">
            <h2 className="text-3xl text-charcoal font-light flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400/80" />
              Danger Zone
            </h2>
            <GlassCard className="p-8 border-red-100/40 bg-red-50/10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-charcoal font-medium">Delete this class</p>
                  <p className="text-warm-grey/70 text-sm">
                    Permanently deletes the class, all its texts, and all student annotations. This cannot be undone.
                  </p>
                </div>
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-full border border-red-200 text-red-500 bg-red-50/30 hover:bg-red-100/40 transition-all text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Class
                  </button>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-red-500 text-sm font-medium">Are you sure?</p>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-5 py-2.5 rounded-full border border-charcoal/10 text-warm-grey hover:bg-white/60 transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteClass}
                      disabled={deletingClass}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-medium disabled:opacity-50"
                    >
                      {deletingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Yes, delete
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          </section>
        </div>
      ) : null}
    </div>
  )
}
