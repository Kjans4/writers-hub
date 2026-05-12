// components/reader/ReaderNav.tsx
// Top navigation bar for all reader-facing pages.
// Links: Home, Write (back to writing tool), Search (stub for Chunk 2).
// Avatar dropdown: profile, settings, sign out.
// Stays sticky at top. Slim, unobtrusive — reading is the focus.

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, PenLine, Search, LogOut, User, ChevronDown } from 'lucide-react'

export default function ReaderNav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [avatarOpen, setAvatarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Load user email for avatar display ───────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  // ── Close avatar dropdown on outside click ────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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

  // Derive initials for avatar placeholder
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : '??'

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link
          href="/home"
          className="font-serif text-lg text-stone-800 tracking-tight hover:text-stone-600 transition-colors flex-shrink-0"
        >
          Writer's Hub
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/home"
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-['Inter']
              transition-colors
              ${isActive('/home')
                ? 'text-stone-800 bg-stone-100 font-medium'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}
            `}
          >
            <BookOpen size={14} />
            Home
          </Link>

          <Link
            href="/dashboard"
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-['Inter']
              transition-colors text-stone-500 hover:text-stone-700 hover:bg-stone-50
            `}
          >
            <PenLine size={14} />
            Write
          </Link>

          {/* Search — stub for Chunk 2 */}
          <button
            onClick={() => router.push('/search')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-['Inter'] text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
            title="Search — coming soon"
          >
            <Search size={14} />
            Search
          </button>
        </nav>

        {/* Avatar dropdown */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setAvatarOpen((o) => !o)}
            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold font-['Inter'] flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <ChevronDown size={13} className="text-stone-300" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">

              {/* User info */}
              {userEmail && (
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-xs text-stone-400 font-['Inter'] truncate">
                    {userEmail}
                  </p>
                </div>
              )}

              <Link
                href="/profile"
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 font-['Inter'] transition-colors"
              >
                <User size={13} />
                Profile
              </Link>

              <div className="border-t border-stone-100 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-500 hover:text-red-500 hover:bg-red-50 font-['Inter'] transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}