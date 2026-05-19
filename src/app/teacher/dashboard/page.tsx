'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpen, Users, LogOut, Loader2, Search } from 'lucide-react'
import { Class } from '@/types/database'
import { generateClassCode } from '@/lib/utils'

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      // Try to get user first
      let { data: { user } } = await supabase.auth.getUser()
      
      // Fallback to session if user is null (can happen on initial load/sync)
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession()
        user = session?.user || null
      }

      if (!user) {
        console.warn('No user found in dashboard, redirecting to login...')
        router.push('/teacher/login')
        return
      }

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching classes:', error)
      } else {
        setClasses(data || [])
      }
    } catch (err) {
      console.error('Unexpected dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const classCode = generateClassCode()

    const { data, error } = await supabase
      .from('classes')
      .insert([
        { 
          name: newClassName, 
          teacher_id: user.id,
          class_code: classCode
        }
      ])
      .select()

    if (error) {
      alert('Error creating class: ' + error.message)
    } else {
      setNewClassName('')
      if (data) setClasses([data[0], ...classes])
    }
    setCreating(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <span className="font-bold text-xl text-gray-900">Teacher Dashboard</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Classes</h1>
            <p className="text-gray-500 mt-1">Manage your active classes and view student progress.</p>
          </div>

          <form onSubmit={handleCreateClass} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter class name (e.g. English 101)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none w-full md:w-64 text-gray-900"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Class
            </button>
          </form>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No classes yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Start by creating your first class using the form above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Link 
                key={cls.id} 
                href={`/teacher/class/${cls.id}`}
                className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {cls.name}
                  </h3>
                  <span className="bg-purple-50 text-purple-700 text-xs font-mono font-bold px-2 py-1 rounded border border-purple-100 uppercase">
                    {cls.class_code}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>View Texts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>View Students</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
