// app/(auth)/signup/page.tsx
// Sign up page. Creates a new Supabase user with email+password.
// On success → redirects to /dashboard.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-stone-800 tracking-tight">
            Writer's Hub
          </h1>
          <p className="text-stone-400 text-sm mt-1 font-['Inter']">
            Begin your first story.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              placeholder="min. 6 characters"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-['Inter'] bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-stone-400 text-sm mt-6 font-['Inter']">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-stone-600 hover:text-stone-800 underline underline-offset-2 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}