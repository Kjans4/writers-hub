// components/reader/ChapterAnnotationShell.tsx
// Wrapper around rendered chapter content on the public reading page.
//
// Responsibilities:
//   1. Provides a positioned container so future text-selection annotations
//      can be anchored relative to the chapter text.
//   2. Exposes a SelectionToolbar (bookmark button + future highlight/note)
//      that appears when the reader selects text.
//   3. The bookmark action calls POST /api/bookmarks/[documentId] directly —
//      ReadingHeader also manages bookmark state independently for its icon.
//      Both are fire-and-forget; the source of truth is the DB.
//
// Props:
//   documentId     — chapter document UUID (used for bookmark API calls)
//   storySlug      — used to build /story/[slug]/chapter/[n] links
//   chapterNumber  — 1-based position, used in bookmark toast label
//   isLoggedIn     — gates bookmark action (redirects to /login if false)
//   children       — the rendered chapter HTML

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Check } from 'lucide-react'

interface ChapterAnnotationShellProps {
  documentId:    string
  storySlug:     string
  chapterNumber: number
  isLoggedIn:    boolean
  children:      React.ReactNode
}

interface SelectionState {
  visible: boolean
  top:     number
  left:    number
}

export default function ChapterAnnotationShell({
  documentId,
  storySlug,
  chapterNumber,
  isLoggedIn,
  children,
}: ChapterAnnotationShellProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // SelectionToolbar state
  const [selection, setSelection]     = useState<SelectionState>({ visible: false, top: 0, left: 0 })
  const [bookmarking, setBookmarking] = useState(false)
  const [toast, setToast]             = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Track text selection ────────────────────────────────────
  // Show a minimal toolbar above the selected text when the reader
  // selects content within this shell. For Phase C the only action
  // is Bookmark; more can be added later without changing this shell.
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()

    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelection((prev) => ({ ...prev, visible: false }))
      return
    }

    // Only show toolbar if the selection is inside our container
    if (!containerRef.current) return
    const range = sel.getRangeAt(0)
    const container = containerRef.current
    if (!container.contains(range.commonAncestorContainer)) {
      setSelection((prev) => ({ ...prev, visible: false }))
      return
    }

    const rect        = range.getBoundingClientRect()
    const scrollY     = window.scrollY
    const toolbarW    = 120  // approximate width — keeps toolbar from clipping viewport edge
    const centeredLeft = rect.left + rect.width / 2 - toolbarW / 2

    setSelection({
      visible: true,
      top:  rect.top + scrollY - 44,  // 44px above the selection start
      left: Math.max(8, Math.min(centeredLeft, window.innerWidth - toolbarW - 8)),
    })
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  // ── Bookmark the chapter from the selection toolbar ─────────
  // This is a secondary path — ReadingHeader also has a bookmark button.
  // Both POST to the same toggle endpoint; last-write-wins is fine here
  // since toggle is idempotent per (user, document).
  async function handleBookmarkFromToolbar() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setBookmarking(true)
    try {
      const res = await fetch(`/api/bookmarks/${documentId}`, { method: 'POST' })
      if (!res.ok) return
      const json = await res.json()
      showToast(
        json.bookmarked
          ? `Chapter ${chapterNumber} bookmarked`
          : 'Bookmark removed'
      )
    } catch {
      // Non-fatal — ReadingHeader is the primary bookmark surface
    } finally {
      setBookmarking(false)
      // Clear the text selection so toolbar hides
      window.getSelection()?.removeAllRanges()
      setSelection((prev) => ({ ...prev, visible: false }))
    }
  }

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  return (
    <>
      {/* Selection toolbar — appears above selected text */}
      {selection.visible && (
        <div
          style={{ top: selection.top, left: selection.left }}
          className="fixed z-40 flex items-center gap-1 bg-stone-800 rounded-lg px-2 py-1.5 shadow-lg select-none"
          // Prevent mousedown from collapsing the selection
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={handleBookmarkFromToolbar}
            disabled={bookmarking}
            className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white font-['Inter'] transition-colors disabled:opacity-40 px-1"
            title="Bookmark this chapter"
          >
            <Bookmark size={12} />
            Bookmark
          </button>
        </div>
      )}

      {/* Chapter content container */}
      <div ref={containerRef} className="relative">
        {children}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-stone-800 text-white text-xs font-['Inter'] px-4 py-2.5 rounded-xl shadow-lg pointer-events-none">
          <Check size={12} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </>
  )
}