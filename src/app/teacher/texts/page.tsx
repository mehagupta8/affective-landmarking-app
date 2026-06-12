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
  BookOpen
} from 'lucide-react'
import { Text, Class } from '@/types/database'
import { GlassCard } from '@/components/ui/GlassCard'
import { PillButton } from '@/components/ui/PillButton'
import { GlassButton } from '@/components/ui/GlassButton'

interface TextWithClass extends Text {
  classes: Class
}

export default function TextsPage() {
  const [texts, setTexts] = useState<TextWithClass[]>([])
  const [loading, setLoading] = useState(true)
  const [editingText, setEditingText] = useState<TextWithClass | null>(null)
  const [editFormData, setEditFormData] = useState({ title: '', content: '', trigger_warning: '' })
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()

  const fetchAllTexts = useCallback(async () => {
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
        .from('texts')
        .select(`
          *,
          classes (*)
        `)
        .order('created_at', { ascending: false })

      if (!error) setTexts(data as TextWithClass[] || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void fetchAllTexts()
  }, [fetchAllTexts])

  const handleUpdateText = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingText) return
    
    setSaving(true)
    const { data, error } = await supabase
      .from('texts')
      .update({ 
        title: editFormData.title, 
        content: editFormData.content, 
        trigger_warning: editFormData.trigger_warning || null 
      })
      .eq('id', editingText.id)
      .select(`
        *,
        classes (*)
      `)
    
    if (!error && data) {
      setTexts(texts.map(t => t.id === editingText.id ? data[0] as TextWithClass : t))
      setEditingText(null)
    }
    setSaving(false)
  }

  const startEditing = (text: TextWithClass) => {
    setEditingText(text)
    setEditFormData({
      title: text.title,
      content: text.content,
      trigger_warning: text.trigger_warning || ''
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
              <label className="block text-sm text-charcoal/60 px-2">Content</label>
              <textarea
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                className="w-full px-8 py-6 bg-white/40 border-none rounded-3xl focus:ring-2 focus:ring-terracotta/20 outline-none min-h-[300px] text-lg text-charcoal leading-relaxed"
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
          texts.map((text) => (
            <GlassCard key={text.id} className="p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group hover:-translate-y-1 transition-all duration-500 shadow-sm border-white/40">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl text-charcoal group-hover:text-terracotta transition-colors duration-500">{text.title}</h3>
                  <span className="glass bg-white/60 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest text-warm-grey uppercase border-white/80 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    {text.classes.name}
                  </span>
                </div>
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
              <div className="flex items-center gap-4 shrink-0">
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
