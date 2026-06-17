// app/(reader)/profile/page.tsx
// Logged-in user's own profile settings page.
// Lets the user edit: username, display name, bio, and avatar URL.
// Accessible from the avatar dropdown in ReaderNav.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Check, Loader2, AlertCircle } from 'lucide-react'

interface ProfileForm {
  username:     string
  display_name: string
  bio:          string
  avatar_url:   string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function normalizeUsername(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

export default function ProfilePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [userId, setUserId]   = useState<string | null>(null)
  const [form, setForm]       = useState<ProfileForm>({
    username:     '',
    display_name: '',
    bio:          '',
    avatar_url:   '',
  })
  const [loading, setLoading]     = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError]         = useState<string | null>(null)

  // ── Load current profile ──────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, bio, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm({
          username:     profile.username     ?? '',
          display_name: profile.display_name ?? '',
          bio:          profile.bio          ?? '',
          avatar_url:   profile.avatar_url   ?? '',
        })
      }

      setLoading(false)
    }

    load()
  }, [])

  function update(field: keyof ProfileForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaveState('idle')
    setError(null)
  }

  // ── Save ──────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    const cleanUsername = normalizeUsername(form.username)

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    setSaveState('saving')
    setError(null)

    // Check username uniqueness (excluding current user)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .neq('id', userId)
      .maybeSingle()

    if (existing) {
      setError('That username is already taken.')
      setSaveState('error')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id:           userId,
        username:     cleanUsername,
        display_name: form.display_name.trim() || cleanUsername,
        bio:          form.bio.trim() || null,
        avatar_url:   form.avatar_url.trim() || null,
        updated_at:   new Date().toISOString(),
      })

    if (updateError) {
      setError(updateError.message)
      setSaveState('error')
      return
    }

    // Sync username back to normalized form
    setForm(prev => ({ ...prev, username: cleanUsername }))
    setSaveState('saved')

    setTimeout(() => setSaveState('idle'), 2500)
  }

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 flex items-center justify-center">
        <Loader2 size={20} className="text-stone-300 animate-spin" />
      </div>
    )
  }

  const avatarInitial = (form.display_name || form.username || '?')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="max-w-xl mx-auto px-6 py-12">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-serif text-2xl text-stone-800 mb-1">Profile</h1>
        <p className="text-sm text-stone-400 font-['Inter']">
          How you appear to readers and other writers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* Avatar preview */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-stone-200 flex-shrink-0 bg-stone-100 flex items-center justify-center">
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatar_url}
                alt="Avatar preview"
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span className="font-serif text-2xl text-stone-400">
                {avatarInitial}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
              Avatar URL
            </label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={e => update('avatar_url', e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
            />
            <p className="text-xs text-stone-400 font-['Inter'] mt-1">
              Paste a direct image URL. Square images work best.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-stone-100" />

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
              value={form.username}
              onChange={e => update('username', normalizeUsername(e.target.value))}
              required
              minLength={3}
              maxLength={30}
              className="w-full pl-7 pr-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              placeholder="your_username"
            />
          </div>
          <p className="text-xs text-stone-400 font-['Inter'] mt-1">
            Letters, numbers, and underscores. Shown on your public profile.
          </p>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
            Display Name
          </label>
          <input
            type="text"
            value={form.display_name}
            onChange={e => update('display_name', e.target.value)}
            maxLength={60}
            placeholder="Your Name"
            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
          />
          <p className="text-xs text-stone-400 font-['Inter'] mt-1">
            Shown in place of your username where space allows. Falls back to username if left blank.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
            Bio{' '}
            <span className="normal-case font-normal text-stone-300">(optional)</span>
          </label>
          <textarea
            value={form.bio}
            onChange={e => update('bio', e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="A sentence or two about you or your writing…"
            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-stone-400 font-['Inter']">
              Appears on your public author page.
            </p>
            <span className={`text-xs font-['Inter'] ${form.bio.length > 180 ? 'text-amber-500' : 'text-stone-300'}`}>
              {form.bio.length}/200
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 font-['Inter']">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saveState === 'saving'}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveState === 'saving' && <Loader2 size={13} className="animate-spin" />}
            {saveState === 'saved'  && <Check   size={13} className="text-emerald-400" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save changes'}
          </button>

          {form.username && (
            <button
              type="button"
              onClick={() => router.push(`/author/${form.username}`)}
              className="text-sm text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
            >
              View public profile →
            </button>
          )}
        </div>
      </form>

      {/* Divider */}
      <div className="mt-14 pt-8 border-t border-stone-100">
        <h2 className="font-serif text-base text-stone-700 mb-1">Account</h2>
        <p className="text-xs text-stone-400 font-['Inter'] mb-4">
          Email changes and password resets are not yet supported in this version.
        </p>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
            router.refresh()
          }}
          className="text-sm text-stone-400 hover:text-red-500 font-['Inter'] transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}