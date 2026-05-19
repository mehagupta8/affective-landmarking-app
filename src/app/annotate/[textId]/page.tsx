'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Trash2, 
  Save, 
  AlertCircle, 
  X,
  Info,
  Users
} from 'lucide-react'
import { Text, Student, Annotation, RASA_CONFIGS, RasaLabel } from '@/types/database'
import { cn } from '@/lib/utils'

export default function AnnotationPage({ params }: { params: Promise<{ textId: string }> }) {
  const { textId } = React.use(params)
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student')
  const router = useRouter()

  const [text, setText] = useState<Text | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [showTriggerWarning, setShowTriggerWarning] = useState(false)
  const [saving, setSaving] = useState(false)

  // Selection State
  const [selection, setSelection] = useState<{ start: number, end: number, rect: DOMRect } | null>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!studentId) {
      router.push('/join')
      return
    }
    fetchInitialData()
  }, [textId, studentId])

  const fetchInitialData = async () => {
    const [textRes, studentRes, annRes] = await Promise.all([
      supabase.from('texts').select('*').eq('id', textId).single(),
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('annotations').select('*').eq('text_id', textId).eq('student_id', studentId)
    ])

    if (textRes.error || !textRes.data) {
      router.push('/join')
      return
    }

    setText(textRes.data)
    setStudent(studentRes.data)
    setAnnotations(annRes.data || [])
    
    if (textRes.data.trigger_warning) {
      setShowTriggerWarning(true)
    }
    
    setLoading(false)
  }

  const handleMouseUp = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !textRef.current) {
      setSelection(null)
      return
    }

    const range = sel.getRangeAt(0)
    
    // Ensure selection is within the text container
    if (!textRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null)
      return
    }

    // Calculate offsets based on text content
    // Note: In a real production app with complex HTML, this is harder, 
    // but for plain text content it's simpler.
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(textRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    const end = start + range.toString().length

    setSelection({
      start,
      end,
      rect: range.getBoundingClientRect()
    })
  }

  const createAnnotation = async (label: RasaLabel) => {
    if (!selection || !studentId || !textId) return
    
    setSaving(true)
    const { data, error } = await supabase
      .from('annotations')
      .insert([{
        text_id: textId,
        student_id: studentId,
        start_offset: selection.start,
        end_offset: selection.end,
        rasa_label: label
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase annotation save error:', error)
      alert(`Failed to save annotation: ${error.message}`)
    } else {
      setAnnotations([...annotations, data])
      setSelection(null)
      window.getSelection()?.removeAllRanges()
    }
    setSaving(false)
  }

  const deleteAnnotation = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('annotations').delete().eq('id', id)
    if (!error) {
      setAnnotations(annotations.filter(a => a.id !== id))
    }
    setSaving(false)
  }

  const renderTextWithHighlights = () => {
    if (!text) return null
    const content = text.content
    
    // Sort annotations by length (descending) so shorter highlights sit "on top" visually
    const sortedAnnotations = [...annotations].sort((a, b) => 
      (b.end_offset - b.start_offset) - (a.end_offset - a.start_offset)
    )

    // A simple way to render overlaps:
    // Create an array of characters and what labels apply to each
    const charMap = content.split('').map((char, index) => {
      const activeAnns = sortedAnnotations.filter(a => index >= a.start_offset && index < a.end_offset)
      return { char, activeAnns }
    })

    // Group adjacent characters with identical sets of annotations
    const groups: { text: string, anns: Annotation[] }[] = []
    let currentGroup: { text: string, anns: Annotation[] } | null = null

    charMap.forEach((item) => {
      const annIds = item.activeAnns.map(a => a.id).join(',')
      if (!currentGroup || currentGroup.anns.map(a => a.id).join(',') !== annIds) {
        currentGroup = { text: item.char, anns: item.activeAnns }
        groups.push(currentGroup)
      } else {
        currentGroup.text += item.char
      }
    })

    return groups.map((group, i) => {
      if (group.anns.length === 0) return <span key={i}>{group.text}</span>
      
      // Merge backgrounds with transparency
      return (
        <span 
          key={i} 
          className="relative inline"
          style={{
            backgroundColor: 'transparent',
          }}
        >
          {group.anns.map((ann, idx) => (
            <span 
              key={ann.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: RASA_CONFIGS[ann.rasa_label].color,
                opacity: 0.3,
                zIndex: idx + 1
              }}
            />
          ))}
          {group.text}
        </span>
      )
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Trigger Warning Modal */}
      {showTriggerWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Content Warning</h2>
            </div>
            <p className="text-gray-600 text-lg mb-8 italic">
              "{text?.trigger_warning}"
            </p>
            <button 
              onClick={() => setShowTriggerWarning(false)}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-colors"
            >
              I Understand, Continue to Text
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen order-2 md:order-1">
        <div className="p-6 border-b border-gray-200 bg-white">
          <Link href="/join" className="flex items-center gap-2 text-gray-500 hover:text-purple-600 mb-4 text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />
            Exit Text
          </Link>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Your Annotations</h2>
            {saving ? (
              <span className="text-[10px] text-purple-500 font-bold uppercase animate-pulse">Saving...</span>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                <Save className="w-3 h-3" />
                Saved
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {annotations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Select text in the main window to add your first annotation.</p>
            </div>
          ) : (
            annotations.map(ann => (
              <div key={ann.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <span 
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: RASA_CONFIGS[ann.rasa_label].color }}
                  >
                    {RASA_CONFIGS[ann.rasa_label].name}
                  </span>
                  <button 
                    onClick={() => deleteAnnotation(ann.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 italic">
                  "{text?.content.substring(ann.start_offset, ann.end_offset)}"
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-purple-50 border-t border-purple-100">
          <div className="flex items-center gap-2 text-purple-700">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">{student?.name}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative h-screen overflow-y-auto order-1 md:order-2">
        <div className="max-w-2xl mx-auto py-20 px-8">
          <h1 className="text-4xl font-black text-gray-900 mb-12 leading-tight">
            {text?.title}
          </h1>
          
          <div 
            ref={textRef}
            onMouseUp={handleMouseUp}
            className="text-xl leading-relaxed text-gray-800 whitespace-pre-wrap selection:bg-purple-200/50 cursor-text"
          >
            {renderTextWithHighlights()}
          </div>
        </div>

        {/* Floating Palette */}
        {selection && (
          <div 
            className="fixed z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 flex gap-1 transform -translate-x-1/2 -translate-y-[120%]"
            style={{ 
              top: selection.rect.top + window.scrollY, 
              left: selection.rect.left + (selection.rect.width / 2) 
            }}
          >
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(RASA_CONFIGS) as RasaLabel[]).map(label => (
                <button
                  key={label}
                  onClick={() => createAnnotation(label)}
                  title={RASA_CONFIGS[label].name}
                  className="w-10 h-10 rounded-xl transition-transform hover:scale-110 flex items-center justify-center text-white"
                  style={{ backgroundColor: RASA_CONFIGS[label].color }}
                >
                  <span className="sr-only">{RASA_CONFIGS[label].name}</span>
                </button>
              ))}
            </div>
            <div className="w-[1px] bg-gray-100 mx-1" />
            <button 
              onClick={() => setSelection(null)}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]", className)} role="status" />
}
