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
  CheckCircle2
} from 'lucide-react'
import { Class, Text, Student, Annotation } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils'

export default function ClassDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const [cls, setCls] = useState<Class | null>(null)
  const [texts, setTexts] = useState<Text[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'texts' | 'students' | 'progress'>('texts')
  
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
      let { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession()
        user = session?.user || null
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

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name', { ascending: true })
      setStudents(studentsData || [])

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
    void fetchClassData() // eslint-disable-line react-hooks/set-state-in-effect
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
          <h1 className="text-5xl font-normal text-charcoal">
            {cls.name}
          </h1>
          <span className="inline-block glass bg-white/60 px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] text-terracotta uppercase border-white/80">
            CODE: {cls.class_code}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-10 border-b border-charcoal/5 mb-8">
        {[
          { id: 'texts', label: 'Texts', count: texts.length, icon: BookOpen },
          { id: 'students', label: 'Students', count: students.length, icon: Users },
          { id: 'progress', label: 'Student Progress', count: students.length, icon: TrendingUp }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'texts' | 'students' | 'progress')}
            className={cn(
              "pb-6 px-2 text-lg transition-all relative",
              activeTab === tab.id ? "text-charcoal" : "text-warm-grey hover:text-charcoal opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id && "text-terracotta")} />
              {tab.label} ({tab.count})
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
            <h2 className="text-3xl text-charcoal font-light">Class Library</h2>
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
                      setNewText({ title: '', content: '', trigger_warning: '' })
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
          <h2 className="text-3xl text-charcoal font-light">Enrolled Students</h2>
          <GlassCard className="p-0 shadow-lg border-white/40 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/40 border-b border-white/60">
                  <th className="px-10 py-6 text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em]">Name</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em]">Joined Date</th>
                  <th className="px-10 py-6 text-[10px] font-bold text-warm-grey/60 uppercase tracking-[0.2em] text-right">Privacy</th>
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
                      <td className="px-10 py-6 text-xl text-charcoal group-hover:text-terracotta transition-colors">{student.name}</td>
                      <td className="px-10 py-6 text-base text-warm-grey/80">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-warm-grey/40 bg-white/40 px-3 py-1 rounded-full border border-white/60">
                          {student.pin ? (
                            <>
                              <Lock className="w-3 h-3" />
                              PIN PROTECTED
                            </>
                          ) : 'OPEN ACCESS'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl text-charcoal font-light">Engagement Overview</h2>
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
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl text-charcoal font-normal">{student.name}</h3>
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
      )}
    </div>
  )
}

function Lock({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
