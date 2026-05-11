// components/layout/ReaderNav.tsx
// Global navigation bar shown on all reader-facing pages.
// Links: Home (feed), Write (editor dashboard), Search (disabled until Chunk 2).
// Avatar dropdown: profile, settings, sign out.
// Unauthenticated users see Login / Sign up instead of avatar.

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Home, PenLine, Search, ChevronDown, User, LogOut } from 'lucide-react'

interface ReaderNavProps {
  user:    { id: string; email?: string } | null
  profile: { username: string | null; display_name: string | null; avatar_url: string | null } | null
}

export default function ReaderNav({ user, profile }: ReaderNavProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [avatarOpen, setAvatarOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    if (avatarOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [avatarOpen])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => pathname.startsWith(href)

  const displayName = profile?.display_name ?? profile?.username ?? user?.email?.split('@')[0] ?? 'Account'
  const initials    = displayName.charAt(0).toUpperCase()

  const navLinkBase   = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-["Inter"] transition-colors'
  const navLinkActive = 'text-stone-800 bg-stone-100 font-medium'
  const navLinkIdle   = 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2">

        {/* Logo */}
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 mr-4"
        >
          <BookOpen size={18} className="text-amber-500" />
          <span className="font-serif text-stone-800 text-lg tracking-tight">
            Writer's Hub
          </span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => router.push('/home')}
            className={`${navLinkBase} ${isActive('/home') ? navLinkActive : navLinkIdle}`}
          >
            <Home size={14} />
            Home
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className={`${navLinkBase} ${isActive('/dashboard') || isActive('/project') ? navLinkActive : navLinkIdle}`}
          >
            <PenLine size={14} />
            Write
          </button>

          <button
            disabled
            className={`${navLinkBase} opacity-40 cursor-not-allowed ${navLinkIdle}`}
            title="Coming in Chunk 2"
          >
            <Search size={14} />
            Search
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth section */}
        {!user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 font-['Inter'] transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
            >
              Sign up
            </button>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setAvatarOpen((o) => !o)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              {/* Avatar */}
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-6 h-6 rounded-full object-cover border border-stone-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                  <span className="text-xs font-semibold text-amber-700 font-['Inter']">
                    {initials}
                  </span>
                </div>
              )}
              <span className="text-sm text-stone-600 font-['Inter'] max-w-[100px] truncate">
                {displayName}
              </span>
              <ChevronDown size={12} className="text-stone-400" />
            </button>

            {/* Dropdown */}
            {avatarOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {profile?.username && (
                  <button
                    onClick={() => {
                      setAvatarOpen(false)
                      router.push(`/author/${profile.username}`)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 font-['Inter'] transition-colors"
                  >
                    <User size={13} className="text-stone-400" />
                    Your profile
                  </button>
                )}

                <div className="h-px bg-stone-100 my-1" />

                <button
                  onClick={() => {
                    setAvatarOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 font-['Inter'] transition-colors"
                >
                  <LogOut size={13} className="text-stone-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}