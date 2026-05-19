'use client'

import { useState, useEffect, use } from 'react'
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

  useEffect(() => {
    fetchClassData()
  }, [classId])

  const fetchClassData = async () => {
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

      // Fetch Class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (classError || !classData) {
        console.error('Error fetching class:', classError)
        router.push('/teacher/dashboard')
        return
      }
      setCls(classData)

      // Fetch Texts
      const { data: textsData } = await supabase
        .from('texts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
      
      setTexts(textsData || [])

      // Fetch Students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name', { ascending: true })
      
      setStudents(studentsData || [])
    } catch (err) {
      console.error('Unexpected class data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingText(true)

    const { data, error } = await supabase
      .from('texts')
      .insert([
        { 
          class_id: classId,
          title: newText.title,
          content: newText.content,
          trigger_warning: newText.trigger_warning || null
        }
      ])
      .select()

    if (error) {
      alert('Error adding text: ' + error.message)
    } else {
      setNewText({ title: '', content: '', trigger_warning: '' })
      setIsAddingText(false)
      if (data) setTexts([data[0], ...texts])
    }
    setSavingText(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!cls) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="font-bold text-xl text-gray-900 leading-tight">{cls.name}</h1>
              <span className="text-xs font-mono text-purple-600 font-bold uppercase tracking-wider">
                CODE: {cls.class_code}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('texts')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'texts' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Texts ({texts.length})
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'students' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students ({students.length})
            </div>
          </button>
        </div>

        {activeTab === 'texts' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Class Texts</h2>
              <button 
                onClick={() => setIsAddingText(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload New Text
              </button>
            </div>

            {isAddingText && (
              <div className="bg-white p-6 rounded-2xl border border-purple-200 mb-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Text</h3>
                <form onSubmit={handleAddText} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newText.title}
                      onChange={(e) => setNewText({ ...newText, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
                      placeholder="e.g. The Road Not Taken"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={newText.content}
                      onChange={(e) => setNewText({ ...newText, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none min-h-[200px] text-gray-900"
                      placeholder="Paste the literary text here..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Trigger Warning (Optional)
                    </label>
                    <input
                      type="text"
                      value={newText.trigger_warning}
                      onChange={(e) => setNewText({ ...newText, trigger_warning: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900"
                      placeholder="e.g. Depictions of violence"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      type="button"
                      onClick={() => setIsAddingText(false)}
                      className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={savingText}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingText && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Text
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {texts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No texts uploaded yet for this class.</p>
                </div>
              ) : (
                texts.map((text) => (
                  <div key={text.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{text.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Added {new Date(text.created_at).toLocaleDateString()}
                      </p>
                      {text.trigger_warning && (
                        <div className="flex items-center gap-1.5 mt-2 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded w-fit border border-amber-100">
                          <AlertTriangle className="w-3 h-3" />
                          TW: {text.trigger_warning}
                        </div>
                      )}
                    </div>
                    <Link 
                      href={`/teacher/class/${cls.id}/text/${text.id}/spectrum`}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-purple-950 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
                    >
                      <BarChart2 className="w-4 h-4" />
                      View Spectrum
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrolled Students</h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase tracking-wider">PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        No students have joined this class yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(student.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-400">
                          {student.pin ? '****' : 'None'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
