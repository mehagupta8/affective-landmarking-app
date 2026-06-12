'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  BarChart2, 
  Loader2, 
  AlertTriangle,
  FileText,
  BookOpen,
  TrendingUp,
  Copy,
  Check
} from 'lucide-react'
import { Text, Class } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils'

interface TextWithClass extends Text {
  classes: Class
}

export default function TextsPage() {
  const [texts, setTexts] = useState<TextWithClass[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  // Clone State
  const [cloningTextId, setCloningTextId] = useState<string | null>(null)
  const [isCloning, setIsCloning] = useState(false)
  const [clonedSuccessId, setClonedSuccessId] = useState<string | null>(null)

  const [editingText, setEditingText] = useState<TextWithClass | null>(null)
  const [editFormData, setEditFormData] = useState({ 
    title: '', 
    author: '',
    source: '',
    content: '', 
    instructions: '',
    trigger_warning: '',
    due_date: ''
  })
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()

  const fetchAllData = useCallback(async () => {
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

      const [textsRes, classesRes] = await Promise.all([
        supabase.from('texts').select('*, classes (*)').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('name', { ascending: true })
      ])

      if (!textsRes.error) setTexts(textsRes.data as TextWithClass[] || [])
      if (!classesRes.error) setClasses(classesRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void fetchAllData()
  }, [fetchAllData])

  const handleCloneToClass = async (text: TextWithClass, targetClassId: string) => {
    if (targetClassId === text.class_id) return
    setIsCloning(true)
    
    const { data, error } = await supabase
      .from('texts')
      .insert([{
        title: text.title,
        author: text.author,
        source: text.source,
        content: text.content,
        instructions: text.instructions,
        trigger_warning: text.trigger_warning,
        due_date: text.due_date,
        class_id: targetClassId
      }])
      .select('*, classes (*)')
      .single()

    if (!error && data) {
      setTexts([data as TextWithClass, ...texts])
      setClonedSuccessId(text.id)
      setTimeout(() => setClonedSuccessId(null), 3000)
    }
    setCloningTextId(null)
    setIsCloning(false)
  }

  const handleUpdateText = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingText) return
    
    setSaving(true)
    const textData = { 
      title: editFormData.title, 
      author: editFormData.author || null,
      source: editFormData.source || null,
      content: editFormData.content, 
      instructions: editFormData.instructions || null,
      trigger_warning: editFormData.trigger_warning || null,
      due_date: editFormData.due_date ? new Date(editFormData.due_date).toISOString() : null
    }

    const { data, error } = await supabase
      .from('texts')
      .update(textData)
      .eq('id', editingText.id)
      .select(`
        *,
        classes (*)
      `)
    
    if (!error && data && data.length > 0) {
      setTexts(texts.map(t => t?.id === editingText.id ? data[0] as TextWithClass : t).filter(Boolean))
      setEditingText(null)
    }
    setSaving(false)
  }

  const startEditing = (text: TextWithClass) => {
    setEditingText(text)
    setEditFormData({
      title: text.title,
      author: text.author || '',
      source: text.source || '',
      content: text.content,
      instructions: text.instructions || '',
      trigger_warning: text.trigger_warning || '',
      due_date: text.due_date ? new Date(text.due_date).toISOString().slice(0, 16) : ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta/60" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-3">
        <h1 className="text-5xl font-normal text-charcoal">All Texts</h1>
        <p className="text-warm-grey text-xl font-light">A unified view of all literary pieces across your classes.</p>
      </div>

      {editingText && (
        <GlassCard className="p-10 shadow-lg border-white/60 animate-in slide-in-from-top-4 duration-500">
          <h3 className="text-2xl text-charcoal mb-8">Edit Text</h3>
          <form onSubmit={handleUpdateText} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm text-charcoal/60 px-2">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-charcoal/60 px-2">Author</label>
                <input
                  type="text"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                  className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm text-charcoal/60 px-2">Source / Citation</label>
                <input
                  type="text"
                  value={editFormData.source}
                  onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                  className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-charcoal/60 px-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-terracotta/60" />
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-charcoal/60 px-2">Content</label>
              <textarea
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                className="w-full px-8 py-6 bg-white/40 border-none rounded-3xl focus:ring-2 focus:ring-terracotta/20 outline-none min-h-[300px] text-lg text-charcoal leading-relaxed"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-charcoal/60 px-2">Special Instructions</label>
              <textarea
                value={editFormData.instructions}
                onChange={(e) => setEditFormData({ ...editFormData, instructions: e.target.value })}
                className="w-full px-8 py-4 bg-white/40 border-none rounded-3xl focus:ring-2 focus:ring-terracotta/20 outline-none min-h-[100px] text-base text-charcoal leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-charcoal/60 px-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-terracotta/60" />
                Trigger Warning (Optional)
              </label>
              <input
                type="text"
                value={editFormData.trigger_warning}
                onChange={(e) => setEditFormData({ ...editFormData, trigger_warning: e.target.value })}
                className="w-full px-6 py-4 bg-white/40 border-none rounded-full focus:ring-2 focus:ring-terracotta/20 outline-none text-lg text-charcoal"
              />
            </div>
            <div className="flex gap-4 justify-end pt-4">
              <GlassButton 
                type="button"
                onClick={() => setEditingText(null)}
                className="px-8 border-none hover:bg-red-50/20 hover:text-red-500"
              >
                Cancel
              </GlassButton>
              <PillButton 
                type="submit"
                disabled={saving}
                className="px-10 flex items-center gap-3"
              >
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                Update Text
              </PillButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-6">
        {texts.length === 0 ? (
          <GlassCard className="py-24 text-center border-dashed border-2 border-white/30 bg-white/10">
            <FileText className="w-16 h-16 text-warm-grey/40 mx-auto mb-6" />
            <p className="text-warm-grey text-xl font-light">You haven&apos;t uploaded any texts yet.</p>
          </GlassCard>
        ) : (
          texts.filter(t => t && t.id).map((text) => (
            <GlassCard key={text.id} className="p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group hover:-translate-y-1 transition-all duration-500 shadow-sm border-white/40">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl text-charcoal group-hover:text-terracotta transition-colors duration-500">{text.title}</h3>
                  <span className="glass bg-white/60 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest text-warm-grey uppercase border-white/80 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    {text.classes?.name || 'Unassigned'}
                  </span>
                </div>
                <p className="text-sm text-warm-grey/60 font-light">
                  Added {new Date(text.created_at).toLocaleDateString()}
                </p>
                {text.due_date && (
                  <div className={cn(
                    "flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full border w-fit",
                    new Date(text.due_date) < new Date() 
                      ? "bg-red-50 text-red-500 border-red-100" 
                      : "bg-terracotta/5 text-terracotta/80 border-terracotta/10"
                  )}>
                    <TrendingUp className="w-3 h-3" />
                    DUE: {new Date(text.due_date).toLocaleString()}
                  </div>
                )}
                {text.trigger_warning && (
                  <div className="flex items-center gap-2 text-terracotta/80 text-sm bg-terracotta/5 px-4 py-1.5 rounded-full border border-terracotta/10 w-fit">
                    <AlertTriangle className="w-4 h-4" />
                    TW: {text.trigger_warning}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative">
                  <GlassButton 
                    onClick={() => setCloningTextId(cloningTextId === text.id ? null : text.id)}
                    className={cn(
                      "flex items-center gap-2 py-3 px-6",
                      clonedSuccessId === text.id && "text-green-500 border-green-200"
                    )}
                  >
                    {clonedSuccessId === text.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {clonedSuccessId === text.id ? 'Cloned!' : 'Clone to...'}
                  </GlassButton>

                  {cloningTextId === text.id && (
                    <div className="absolute top-full right-0 mt-2 z-20 w-64 bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-2 animate-in fade-in zoom-in duration-200">
                      <div className="px-3 py-2 border-b border-charcoal/5 mb-2">
                        <span className="text-[10px] font-black text-terracotta uppercase tracking-widest">Select Target Class</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {classes.filter(c => c.id !== text.class_id).map(cls => (
                          <button
                            key={cls.id}
                            onClick={() => handleCloneToClass(text, cls.id)}
                            disabled={isCloning}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-terracotta/5 hover:text-terracotta transition-colors text-sm flex items-center justify-between group"
                          >
                            <span className="truncate">{cls.name}</span>
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                        {classes.filter(c => c.id !== text.class_id).length === 0 && (
                          <div className="px-3 py-4 text-center text-xs text-warm-grey/60 italic">
                            No other classes available.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <GlassButton 
                  onClick={() => startEditing(text)}
                  className="flex items-center gap-2 py-3 px-6"
                >
                  Edit
                </GlassButton>
                <Link 
                  href={`/teacher/class/${text.class_id}/text/${text.id}/spectrum`}
                >
                  <PillButton className="flex items-center gap-3 px-10">
                    <BarChart2 className="w-5 h-5" />
                    View Spectrum
                  </PillButton>
                </Link>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
