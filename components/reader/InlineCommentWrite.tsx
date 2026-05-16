// components/reader/InlineCommentWrite.tsx
// Inline write box that appears near the current text selection
// when the reader clicks the Comment button in SelectionToolbar.
//
// Props:
//   documentId    — chapter document UUID
//   anchor        — the captured anchor from captureAnchor()
//   onPosted      — called with the new comment after successful POST
//                   so MarginBubbleLayer can update its count immediately
//   onCancel      — called when the user dismisses without posting
//   editMode      — if true, shows "Edit" label and uses PATCH instead of POST
//   existingId    — required when editMode=true, the comment UUID to PATCH
//   initialContent — pre-filled text when editMode=true
//
// Positioning: the parent (SelectionToolbar / ChapterAnnotationShell)
// passes the selection rect. This component positions itself absolutely
// below that rect using fixed coordinates.

'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, X, Loader2 } from 'lucide-react'

interface AnnotationAnchor {
  paragraph_key: string
  start_offset:  number
  end_offset:    number
  selected_text: string
}

interface InlineCommentWriteProps {
  documentId:      string
  anchor:          AnnotationAnchor
  selectionRect:   DOMRect
  onPosted:        (comment: {
    id:            string
    paragraph_key: string
    content:       string
    appreciation_count: number
    created_at:    string
  }) => void
  onCancel:        () => void
  editMode?:       boolean
  existingId?:     string
  initialContent?: string
}

const MAX_CHARS = 280

export default function InlineCommentWrite({
  documentId,
  anchor,
  selectionRect,
  onPosted,
  onCancel,
  editMode = false,
  existingId,
  initialContent = '',
}: InlineCommentWriteProps) {
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [])

  // Click-outside close
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onCancel])

  // Position: below the selection rect, left-aligned, fixed
  const top  = selectionRect.bottom + window.scrollY + 8
  const left = Math.max(
    8,
    Math.min(selectionRect.left + window.scrollX, window.innerWidth - 320 - 8)
  )

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_CHARS) return

    setLoading(true)
    setError(null)

    try {
      let res: Response

      if (editMode && existingId) {
        // PATCH — edit existing comment
        res = await fetch(`/api/annotations/inline-comments/${existingId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ content: trimmed }),
        })
      } else {
        // POST — create new comment
        res = await fetch('/api/annotations/inline-comments', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            document_id:   documentId,
            paragraph_key: anchor.paragraph_key,
            start_offset:  anchor.start_offset,
            end_offset:    anchor.end_offset,
            selected_text: anchor.selected_text,
            content:       trimmed,
          }),
        })
      }

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }

      const json = await res.json()
      onPosted(json.comment)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel()
    }
    // Cmd/Ctrl+Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const remaining = MAX_CHARS - content.length
  const canSubmit = content.trim().length > 0 && content.length <= MAX_CHARS

  return (
    <div
      ref={boxRef}
      style={{ top, left, position: 'fixed', zIndex: 60, width: 300 }}
      className="bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter']">
          {editMode ? 'Edit reaction' : 'Leave a reaction'}
        </span>
        <button
          onClick={onCancel}
          className="p-0.5 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Passage preview */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-xs text-stone-400 font-serif italic leading-relaxed line-clamp-2">
          "{anchor.selected_text}"
        </p>
      </div>

      {/* Textarea */}
      <div className="px-3 pb-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What hit you about this passage?"
          rows={3}
          className="w-full text-sm font-['Inter'] text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder:text-stone-300"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="px-3 pb-1 text-xs text-red-500 font-['Inter']">{error}</p>
      )}

      {/* Footer */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <span
          className={`text-xs font-['Inter'] ${
            remaining < 20 ? 'text-amber-500' : 'text-stone-300'
          }`}
        >
          {remaining}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-300 font-['Inter'] hidden sm:block">
            ⌘↵ to post
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Send size={11} />
            )}
            {editMode ? 'Save' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}