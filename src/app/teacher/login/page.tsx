'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'auth-code-error') {
      setError('The authentication link is invalid or has expired. Please try signing in with your email and password.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Attempting login for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error.message)
        setError(error.message)
        setLoading(false)
      } else {
        console.log('Login successful, redirecting...')
        // Force a hard refresh to ensure middleware picks up the new session
        window.location.href = '/teacher/dashboard'
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="p-3 bg-purple-100 rounded-full mb-4">
          <GraduationCap className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center">Teacher Login</h1>
        <p className="text-gray-500 text-sm mt-1 text-center">
          Sign in to manage your classes and texts.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900"
            placeholder="you@school.edu"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-gray-900"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : 'Sign In'}
        </button>
      </form>

      <p className="text-center mt-8 text-sm text-gray-500">
        Don't have an account?{' '}
        <Link href="/teacher/signup" className="text-purple-600 font-semibold hover:underline">
          Sign up
        </Link>
      </p>

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
          ← Back to landing page
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-purple-600" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
