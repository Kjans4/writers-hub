// components/reader/SelectionToolbar.tsx
// Floating toolbar that appears when a reader selects text inside
// the ChapterAnnotationShell container on a (reader) page.
//
// Three actions:
//   🖊 Highlight  — captures anchor, POSTs to highlights API, renders mark
//   💬 Comment    — placeholder for Phase B (fires no-op for now)
//   🔖 Bookmark   — placeholder for Phase C (fires no-op for now)
//
// Rules:
//   - Only mounts on (reader) pages. Never inside the TipTap editor.
//   - Highlight button is disabled when captureAnchor() returns null
//     (cross-paragraph, no paragraph-key ancestor, or empty selection).
//   - Logged-out users see a "Log in to save highlights" tooltip instead
//     of saving.
//   - Disappears on click-away or when selection collapses.
//
// Props:
//   containerRef  — ref to the prose container element.
//                   Only selections inside this element trigger the toolbar.
//   documentId    — needed for the highlights POST body.
//   isLoggedIn    — controls logged-out tooltip vs. save behaviour.
//   onHighlight   — called with the saved highlight id after a successful
//                   POST so HighlightLayer can re-render immediately.

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { captureAnchor, AnnotationAnchor } from '@/lib/annotations/captureAnchor'
import { Highlighter, MessageCircle, Bookmark, LogIn, Loader2 } from 'lucide-react'

interface SelectionToolbarProps {
  // HTMLElement | null matches the RefObject produced by useRef<HTMLDivElement | null>(null)
  containerRef: React.RefObject<HTMLElement | null>
  documentId: string
  isLoggedIn: boolean
  onHighlight?: (highlightId: string) => void
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
}: SelectionToolbarProps) {
  const [visible, setVisible]           = useState(false)
  const [position, setPosition]         = useState<ToolbarPosition>({ top: 0, left: 0 })
  const [anchor, setAnchor]             = useState<AnnotationAnchor | null>(null)
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

    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 220
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

    // Run captureAnchor — result determines whether Highlight is enabled
    const captured = captureAnchor(sel)
    setAnchor(captured)
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

    // Already saved this selection
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

  if (!visible) return null

  const highlightDisabled = !anchor || saving || !!savedId

  return (
    <div
      ref={toolbarRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 select-none"
      // Prevent mousedown from collapsing the selection
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Login tooltip */}
      {showLoginTip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-stone-800 text-white text-xs font-['Inter'] px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
          <LogIn size={11} />
          Log in to save highlights
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
          disabled={highlightDisabled}
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
              : highlightDisabled
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

        {/* Comment — Phase B placeholder */}
        <button
          onClick={() => {/* Phase B */}}
          title="Comment (coming in Phase B)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter'] text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors"
        >
          <MessageCircle size={12} />
          Comment
        </button>

        <div className="w-px h-4 bg-stone-100" />

        {/* Bookmark — Phase C placeholder */}
        <button
          onClick={() => {/* Phase C */}}
          title="Bookmark (coming in Phase C)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter'] text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors"
        >
          <Bookmark size={12} />
          Bookmark
        </button>

      </div>
    </div>
  )
}