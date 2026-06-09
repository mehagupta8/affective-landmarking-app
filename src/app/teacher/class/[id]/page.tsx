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
  FileText
} from 'lucide-react'
import { Class, Text, Student } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils'

export default function ClassDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const [cls, setCls] = useState<Class | null>(null)
  const [texts, setTexts] = useState<Text[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'texts' | 'students'>('texts')
  
  // New Text Form State
  const [isAddingText, setIsAddingText] = useState(false)
  const [newText, setNewText] = useState({ title: '', content: '', trigger_warning: '' })
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
    const { data, error } = await supabase
      .from('texts')
      .insert([{ class_id: classId, title: newText.title, content: newText.content, trigger_warning: newText.trigger_warning || null }])
      .select()
    if (!error && data) {
      setNewText({ title: '', content: '', trigger_warning: '' })
      setIsAddingText(false)
      setTexts([data[0], ...texts])
    }
    setSavingText(false)
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
          { id: 'students', label: 'Students', count: students.length, icon: Users }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'texts' | 'students')}
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
              <h3 className="text-2xl text-charcoal mb-8">Add New Text</h3>
              <form onSubmit={handleAddText} className="space-y-6">
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
                    onClick={() => setIsAddingText(false)}
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
                    Save Text
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
                    <h3 className="text-3xl text-charcoal group-hover:text-terracotta transition-colors duration-500">{text.title}</h3>
                    <p className="text-sm text-warm-grey/60 font-light">
                      Added {new Date(text.created_at).toLocaleDateString()}
                    </p>
                    {text.trigger_warning && (
                      <div className="flex items-center gap-2 text-terracotta/80 text-sm bg-terracotta/5 px-4 py-1.5 rounded-full border border-terracotta/10 w-fit">
                        <AlertTriangle className="w-4 h-4" />
                        TW: {text.trigger_warning}
                      </div>
                    )}
                  </div>
                  <Link 
                    href={`/teacher/class/${cls.id}/text/${text.id}/spectrum`}
                    className="shrink-0"
                  >
                    <PillButton className="flex items-center gap-3 px-10">
                      <BarChart2 className="w-5 h-5" />
                      View Spectrum
                    </PillButton>
                  </Link>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}

function Lock({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
