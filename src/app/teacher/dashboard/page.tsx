'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpen, Users, Loader2, Settings2, X, Calendar } from 'lucide-react'
import { Class } from '@/types/database'
import { generateClassCode } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassDueDate, setNewClassDueDate] = useState('')
  
  // Edit State
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', due_date: '' })
  const [saving, setSaving] = useState(false)

  const router = useRouter()

  const fetchClasses = useCallback(async () => {
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
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setClasses(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void fetchClasses() // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchClasses])

  const handleCreateClass = async (e: FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const classCode = generateClassCode()
    const { data, error } = await supabase
      .from('classes')
      .insert([{ 
        name: newClassName, 
        teacher_id: user.id, 
        class_code: classCode,
        due_date: newClassDueDate ? new Date(newClassDueDate).toISOString() : null
      }])
      .select()
    if (!error && data) {
      setNewClassName('')
      setNewClassDueDate('')
      setClasses([data[0], ...classes])
    }
    setCreating(false)
  }

  const handleUpdateClass = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingClass) return
    setSaving(true)
    
    const { data, error } = await supabase
      .from('classes')
      .update({
        name: editFormData.name,
        due_date: editFormData.due_date ? new Date(editFormData.due_date).toISOString() : null
      })
      .eq('id', editingClass.id)
      .select()
    
    if (!error && data) {
      setClasses(classes.map(c => c.id === editingClass.id ? data[0] : c))
      setEditingClass(null)
    }
    setSaving(false)
  }

  const startEditing = (e: React.MouseEvent, cls: Class) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingClass(cls)
    setEditFormData({
      name: cls.name,
      due_date: cls.due_date ? new Date(cls.due_date).toISOString().slice(0, 16) : ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-normal text-charcoal">Your Classes</h1>
          <p className="text-warm-grey text-xl font-light">Manage your active classes and view student progress.</p>
        </div>

        <GlassCard className="p-6 flex flex-col gap-6 min-w-[450px] shadow-lg border-white/40">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Class name (e.g. English 101)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="flex-1 bg-white/30 border-none rounded-full px-8 py-4 text-charcoal placeholder:text-warm-grey/40 focus:ring-2 focus:ring-terracotta/20 outline-none text-lg transition-all"
              required
            />
            <PillButton
              onClick={handleCreateClass}
              disabled={creating || !newClassName}
              className="py-4 px-8 shrink-0 flex items-center justify-center min-w-[60px]"
            >
              {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </PillButton>
          </div>
          <div className="flex items-center gap-4 px-4">
            <Calendar className="w-4 h-4 text-terracotta/40" />
            <input 
              type="datetime-local"
              value={newClassDueDate}
              onChange={(e) => setNewClassDueDate(e.target.value)}
              className="bg-transparent border-none text-sm text-charcoal/60 outline-none"
            />
            <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest ml-auto">Optional Class Deadline</span>
          </div>
        </GlassCard>
      </div>

      {/* Edit Modal */}
      {editingClass && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-charcoal/10 backdrop-blur-sm animate-in fade-in duration-300">
          <GlassCard className="max-w-md w-full p-10 shadow-2xl border-white/60">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl text-charcoal">Edit Class Info</h3>
              <button onClick={() => setEditingClass(null)} className="text-warm-grey hover:text-charcoal transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateClass} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm text-charcoal/60 px-2">Class Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-charcoal/60 px-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-terracotta/60" />
                  Class Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                />
              </div>
              <PillButton type="submit" disabled={saving} className="w-full py-4 flex items-center justify-center gap-3">
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                Save Changes
              </PillButton>
            </form>
          </GlassCard>
        </div>
      )}

      {classes.length === 0 ? (
        <GlassCard className="py-32 text-center border-dashed border-2 border-white/30 bg-white/10">
          <div className="bg-white/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm backdrop-blur-sm">
            <Users className="w-12 h-12 text-warm-grey/40" />
          </div>
          <h3 className="text-3xl text-charcoal font-light">No classes yet</h3>
          <p className="text-warm-grey mt-3 text-lg">
            Start by creating your first class using the portal above.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {classes.map((cls) => (
            <div key={cls.id} className="relative group">
              <Link href={`/teacher/class/${cls.id}`}>
                <GlassCard className="h-full p-10 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col justify-between border-white/40 shadow-md">
                  {/* Decorative Background Artwork */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-terracotta/10 to-transparent -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-3xl text-charcoal group-hover:text-terracotta transition-colors duration-500 pr-4 font-normal leading-tight">
                        {cls.name}
                      </h3>
                      <span className="glass bg-white/90 text-charcoal text-[10px] tracking-widest font-bold px-4 py-1.5 rounded-full border border-white/50 uppercase shadow-sm shrink-0">
                        {cls.class_code}
                      </span>
                    </div>

                    {cls.due_date && (
                      <div className={cn(
                        "flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full border w-fit mb-8",
                        new Date(cls.due_date) < new Date() 
                          ? "bg-red-50 text-red-500 border-red-100" 
                          : "bg-white/60 text-warm-grey border-white/80"
                      )}>
                        <Calendar className="w-3 h-3" />
                        DUE: {new Date(cls.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8 text-sm text-warm-grey/80 font-medium">
                      <div className="flex items-center gap-2.5 group-hover:text-charcoal transition-colors">
                        <BookOpen className="w-5 h-5 text-terracotta/40" />
                        <span>Texts</span>
                      </div>
                      <div className="flex items-center gap-2.5 group-hover:text-charcoal transition-colors">
                        <Users className="w-5 h-5 text-terracotta/40" />
                        <span>Students</span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => startEditing(e, cls)}
                      className="p-2 hover:bg-white/60 rounded-full text-warm-grey/40 hover:text-terracotta transition-all"
                    >
                      <Settings2 className="w-5 h-5" />
                    </button>
                  </div>
                </GlassCard>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
