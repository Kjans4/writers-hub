// app/(auth)/signup/page.tsx
// Sign up page. Creates a new Supabase user with email + password + username.
// On success → redirects to /dashboard.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,           setEmail]           = useState('')
  const [username,        setUsername]        = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)

  // Normalize username: lowercase, strip anything that isn't a-z 0-9 _
  function normalizeUsername(raw: string) {
    return raw.toLowerCase().replace(/[^a-z0-9_]/g, '')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanUsername = normalizeUsername(username)

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores).')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    // Check username uniqueness before creating the auth user
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (existing) {
      setError('That username is already taken. Please choose another.')
      setLoading(false)
      return
    }

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // Insert / update profile row with username
    if (data.user) {
      await supabase
        .from('profiles')
        .upsert({
          id:           data.user.id,
          username:     cleanUsername,
          display_name: cleanUsername,
        })
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Live password match indicator — only shown once the user starts typing the confirm field
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const passwordMatch    = confirmPassword.length > 0 && password === confirmPassword

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

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-['Inter'] pointer-events-none select-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(normalizeUsername(e.target.value))}
                required
                minLength={3}
                maxLength={30}
                className="w-full pl-7 pr-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                placeholder="your_username"
                autoComplete="username"
              />
            </div>
            <p className="text-xs text-stone-400 font-['Inter'] mt-1">
              Letters, numbers, and underscores only.
            </p>
          </div>

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={`w-full px-3 py-2.5 bg-white border rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 transition-all
                ${passwordMismatch
                  ? 'border-red-300 focus:ring-red-400/50 focus:border-red-400'
                  : passwordMatch
                  ? 'border-emerald-300 focus:ring-emerald-400/50 focus:border-emerald-400'
                  : 'border-stone-200 focus:ring-amber-400/50 focus:border-amber-400'}
              `}
              placeholder="Re-enter your password"
            />
            {passwordMismatch && (
              <p className="text-xs text-red-500 font-['Inter'] mt-1">
                Passwords do not match.
              </p>
            )}
            {passwordMatch && (
              <p className="text-xs text-emerald-600 font-['Inter'] mt-1">
                Passwords match.
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-xs font-['Inter'] bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || passwordMismatch}
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