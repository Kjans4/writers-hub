// components/reader/SelectionToolbar.tsx
// Floating toolbar that appears when a reader selects text inside
// the ChapterAnnotationShell container on a (reader) page.
//
// Three actions:
//   🖊 Highlight  — captures anchor, POSTs to highlights API, renders mark
//   💬 Comment    — captures anchor, opens InlineCommentWrite near selection
//   🔖 Bookmark   — placeholder for Phase C (fires no-op — bookmark is in header)
//
// Rules:
//   - Only mounts on (reader) pages. Never inside the TipTap editor.
//   - Highlight + Comment buttons are disabled when captureAnchor() returns null
//     (cross-paragraph, no paragraph-key ancestor, or empty selection).
//   - Logged-out users see a "Log in to save highlights" tooltip.
//   - Disappears on click-away or when selection collapses.
//   - Comment click: saves the current selectionRect + anchor, fires onComment
//     so the parent can mount InlineCommentWrite.

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { captureAnchor, AnnotationAnchor } from '@/lib/annotations/captureAnchor'
import { Highlighter, MessageCircle, Bookmark, LogIn, Loader2 } from 'lucide-react'

interface SelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>
  documentId: string
  isLoggedIn: boolean
  onHighlight?: (highlightId: string) => void
  // Phase B: called when user clicks Comment — parent mounts InlineCommentWrite
  onComment?: (anchor: AnnotationAnchor, selectionRect: DOMRect) => void
}

interface ToolbarPosition {
  top: number
  left: number
}

export default function SelectionToolbar({
  containerRef,
  documentId,
  isLoggedIn,
  onHighlight,
  onComment,
}: SelectionToolbarProps) {
  const [visible, setVisible]           = useState(false)
  const [position, setPosition]         = useState<ToolbarPosition>({ top: 0, left: 0 })
  const [anchor, setAnchor]             = useState<AnnotationAnchor | null>(null)
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const [saving, setSaving]             = useState(false)
  const [savedId, setSavedId]           = useState<string | null>(null)
  const [showLoginTip, setShowLoginTip] = useState(false)

  const toolbarRef = useRef<HTMLDivElement>(null)

  // ── Track selection changes ───────────────────────────────
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()

    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setVisible(false)
      setAnchor(null)
      setSavedId(null)
      setSelectionRect(null)
      return
    }

    // Only respond to selections inside our container
    const range = sel.getRangeAt(0)
    if (
      !containerRef.current ||
      !containerRef.current.contains(range.commonAncestorContainer)
    ) {
      return
    }

    // Position toolbar above the selection midpoint
    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) return

    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 240
    const scrollY = window.scrollY

    setPosition({
      top:  rect.top + scrollY - 48,
      left: Math.max(
        8,
        Math.min(
          rect.left + rect.width / 2 - toolbarWidth / 2,
          window.innerWidth - toolbarWidth - 8
        )
      ),
    })

    // Run captureAnchor — result determines whether Highlight/Comment are enabled
    const captured = captureAnchor(sel)
    setAnchor(captured)
    setSelectionRect(rect)
    setSavedId(null)
    setShowLoginTip(false)
    setVisible(true)
  }, [containerRef])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  // ── Click outside collapses toolbar ──────────────────────
  useEffect(() => {
    if (!visible) return

    function handleMouseDown(e: MouseEvent) {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return
      }
      setVisible(false)
      setAnchor(null)
      setSavedId(null)
      setShowLoginTip(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [visible])

  // ── Highlight action ──────────────────────────────────────
  async function handleHighlight() {
    if (!anchor) return

    if (!isLoggedIn) {
      setShowLoginTip(true)
      return
    }

    if (savedId) return

    setSaving(true)

    try {
      const res = await fetch('/api/annotations/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id:   documentId,
          paragraph_key: anchor.paragraph_key,
          start_offset:  anchor.start_offset,
          end_offset:    anchor.end_offset,
          selected_text: anchor.selected_text,
          color:         '#FEF08A',
          note:          null,
          is_public:     false,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        console.error('[SelectionToolbar] highlight save failed:', json.error)
        return
      }

      const id = json.highlight?.id
      setSavedId(id ?? null)
      onHighlight?.(id)

      // Dismiss toolbar after short delay so the reader sees the ✓
      setTimeout(() => {
        setVisible(false)
        setAnchor(null)
        setSavedId(null)
      }, 800)
    } finally {
      setSaving(false)
    }
  }

  // ── Comment action ────────────────────────────────────────
  function handleComment() {
    if (!anchor || !selectionRect) return

    if (!isLoggedIn) {
      setShowLoginTip(true)
      return
    }

    // Dismiss toolbar — InlineCommentWrite will take over
    setVisible(false)

    // Fire event to parent with anchor + rect so it can position write box
    onComment?.(anchor, selectionRect)
  }

  if (!visible) return null

  const actionDisabled = !anchor || saving || !!savedId

  return (
    <div
      ref={toolbarRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 select-none"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Login tooltip */}
      {showLoginTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-stone-800 text-white text-xs font-['Inter'] px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
          <LogIn size={11} />
          Log in to save
          <a
            href="/login"
            className="underline underline-offset-2 text-amber-300 hover:text-amber-200"
          >
            Sign in →
          </a>
        </div>
      )}

      {/* Toolbar pill */}
      <div className="flex items-center gap-px bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden px-1 py-1">

        {/* Highlight */}
        <button
          onClick={handleHighlight}
          disabled={actionDisabled}
          title={
            !anchor
              ? 'Select text within a single paragraph to highlight'
              : savedId
              ? 'Highlighted'
              : 'Highlight'
          }
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter']
            transition-all
            ${savedId
              ? 'bg-amber-50 text-amber-700'
              : actionDisabled
              ? 'text-stone-300 cursor-not-allowed'
              : 'text-stone-600 hover:bg-amber-50 hover:text-amber-700'}
          `}
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Highlighter size={12} />
          )}
          {savedId ? 'Saved' : 'Highlight'}
        </button>

        <div className="w-px h-4 bg-stone-100" />

        {/* Comment — Phase B: now live */}
        <button
          onClick={handleComment}
          disabled={!anchor}
          title={
            !anchor
              ? 'Select text within a single paragraph to comment'
              : 'Leave a reaction'
          }
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter']
            transition-colors
            ${!anchor
              ? 'text-stone-300 cursor-not-allowed'
              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'}
          `}
        >
          <MessageCircle size={12} />
          Comment
        </button>

        <div className="w-px h-4 bg-stone-100" />

        {/* Bookmark — handled by ReadingHeader; this pill just gives discoverability */}
        <button
          onClick={() => {
            // Bookmark is at the chapter level — the header icon handles it.
            // Dismiss toolbar and let user find the header icon.
            setVisible(false)
          }}
          title="Use the bookmark icon in the reading header"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter'] text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors"
        >
          <Bookmark size={12} />
          Bookmark
        </button>

      </div>
    </div>
  )
}