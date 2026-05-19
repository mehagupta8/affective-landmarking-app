'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, ArrowRight, Loader2, BookOpen, Lock } from 'lucide-react'
import { Class, Text } from '@/types/database'

type JoinStep = 'code' | 'identity' | 'select-text'

export default function JoinPage() {
  const [step, setStep] = useState<JoinStep>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for step 'code'
  const [classCode, setClassCode] = useState('')
  const [foundClass, setFoundClass] = useState<Class | null>(null)
  
  // State for step 'identity'
  const [studentName, setStudentName] = useState('')
  const [pin, setPin] = useState('')
  const [studentId, setStudentId] = useState<string | null>(null)
  
  // State for step 'select-text'
  const [texts, setTexts] = useState<Text[]>([])

  const router = useRouter()

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', classCode.toUpperCase())
      .single()

    if (fetchError || !data) {
      setError('Invalid class code. Please check with your teacher.')
    } else {
      setFoundClass(data)
      setStep('identity')
    }
    setLoading(false)
  }

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!foundClass) return

    // 1. Check if student already exists in this class
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', foundClass.id)
      .eq('name', studentName.trim())
      .single()

    if (existingStudent) {
      // If PIN exists, verify it
      if (existingStudent.pin && existingStudent.pin !== pin) {
        setError('Incorrect PIN for this name. If you forgot it, ask your teacher.')
        setLoading(false)
        return
      }
      setStudentId(existingStudent.id)
    } else {
      // 2. Create new student
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert([
          { 
            class_id: foundClass.id, 
            name: studentName.trim(), 
            pin: pin || null 
          }
        ])
        .select()
        .single()

      if (createError) {
        setError('Could not join class: ' + createError.message)
        setLoading(false)
        return
      }
      setStudentId(newStudent.id)
    }

    // 3. Fetch texts for this class to let student pick one
    const { data: classTexts } = await supabase
      .from('texts')
      .select('*')
      .eq('class_id', foundClass.id)
      .order('created_at', { ascending: false })

    setTexts(classTexts || [])
    setStep('select-text')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white flex flex-col items-center">
          <div className="p-3 bg-white/20 rounded-full mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Join a Class</h1>
          <p className="text-blue-100 text-sm mt-1">Participate in literary analysis.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
              <span>{error}</span>
            </div>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Enter Class Code
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition-all uppercase placeholder:text-gray-200"
                  placeholder="X7B9P2"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Ask your teacher for the 6-character code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || classCode.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find Class'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {step === 'identity' && foundClass && (
            <form onSubmit={handleIdentify} className="space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Joining</span>
                <h2 className="text-xl font-bold text-gray-900">{foundClass.name}</h2>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition-all text-gray-900 font-bold"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                  PIN (4-digit, optional)
                  <Lock className="w-3 h-3 text-gray-400" />
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none transition-all text-gray-900 text-center text-2xl tracking-[1em]"
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Use a PIN if you want to protect your annotations.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !studentName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Analyzing'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {step === 'select-text' && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Success!</span>
                <h2 className="text-xl font-bold text-gray-900">Pick a text to begin</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {texts.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No texts have been uploaded for this class yet.</p>
                ) : (
                  texts.map((text) => (
                    <button
                      key={text.id}
                      onClick={() => router.push(`/annotate/${text.id}?student=${studentId}`)}
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-2xl transition-all group text-left"
                    >
                      <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-700">{text.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
