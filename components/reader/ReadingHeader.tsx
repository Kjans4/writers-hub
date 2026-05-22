// components/reader/ReadingHeader.tsx
// Navigation fix: added minimal nav strip above the chapter header.
// Strip links: Home (logo), Library, Write for logged-in users.
// Logged-out users see a Log in link instead.

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, ArrowLeft, Check, List, BookOpen } from 'lucide-react'

interface ReadingHeaderProps {
  storyTitle:    string
  storySlug:     string
  chapterNumber: number
  totalChapters: number
  documentId:    string
  isLoggedIn:    boolean
  onToggleTOC?:  () => void
}

export default function ReadingHeader({
  storyTitle,
  storySlug,
  chapterNumber,
  totalChapters,
  documentId,
  isLoggedIn,
  onToggleTOC,
}: ReadingHeaderProps) {
  const router = useRouter()

  const [bookmarked, setBookmarked]           = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [toast, setToast]                     = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  // Fetch initial bookmark status
  useEffect(() => {
    if (!isLoggedIn) return
    async function check() {
      try {
        const res = await fetch(`/api/bookmarks/${documentId}`)
        if (!res.ok) return
        const json = await res.json()
        setBookmarked(json.bookmarked)
      } catch {
        // Non-fatal
      }
    }
    check()
  }, [documentId, isLoggedIn])

  // Optimistic bookmark toggle
  async function handleBookmark() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    const wasBookmarked = bookmarked
    setBookmarked(!wasBookmarked)
    setBookmarkLoading(true)

    try {
      const res = await fetch(`/api/bookmarks/${documentId}`, { method: 'POST' })
      if (!res.ok) {
        setBookmarked(wasBookmarked)
        return
      }
      const json = await res.json()
      setBookmarked(json.bookmarked)
      showToast(
        json.bookmarked
          ? `Chapter ${chapterNumber} bookmarked`
          : 'Bookmark removed'
      )
    } catch {
      setBookmarked(wasBookmarked)
    } finally {
      setBookmarkLoading(false)
    }
  }

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  return (
    <>
      {/* ── Minimal nav strip (navigation fix) ───────────────── */}
      <div className="sticky top-0 left-0 w-full z-30 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 h-9 flex items-center justify-between">

          {/* Logo → home */}
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <BookOpen size={13} className="text-amber-500" />
            <span className="text-xs font-medium font-['Inter'] tracking-tight">
              Writer's Hub
            </span>
          </Link>

          {/* Right links */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/library"
                  className="text-xs text-stone-400 hover:text-stone-700 font-['Inter'] transition-colors"
                >
                  Library
                </Link>
                <Link
                  href="/dashboard"
                  className="text-xs text-stone-400 hover:text-stone-700 font-['Inter'] transition-colors"
                >
                  Write
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs text-stone-400 hover:text-stone-700 font-['Inter'] transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Chapter header (existing) ─────────────────────────── */}
      <header className="sticky top-9 left-0 w-full z-20 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center gap-3">

          {/* Back to story info page */}
          <button
            onClick={() => router.push(`/story/${storySlug}`)}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
            title={`Back to ${storyTitle}`}
          >
            <ArrowLeft size={15} />
          </button>

          {/* Story title + chapter progress */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <button
              onClick={() => router.push(`/story/${storySlug}`)}
              className="font-serif text-sm text-stone-700 hover:text-stone-900 transition-colors truncate max-w-[200px]"
            >
              {storyTitle}
            </button>
            <span className="text-stone-300 text-xs font-['Inter'] flex-shrink-0">
              Chapter {chapterNumber} of {totalChapters}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* Bookmark toggle */}
            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={`
                p-1.5 rounded-lg transition-colors
                ${bookmarked
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}
                disabled:opacity-40
              `}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}
            >
              <Bookmark
                size={15}
                className={bookmarked ? 'fill-amber-500' : ''}
              />
            </button>

            {/* Table of contents */}
            {onToggleTOC && (
              <button
                onClick={onToggleTOC}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                title="Table of contents"
              >
                <List size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toast confirmation */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-stone-800 text-white text-xs font-['Inter'] px-4 py-2.5 rounded-xl shadow-lg pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check size={12} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </>
  )
}