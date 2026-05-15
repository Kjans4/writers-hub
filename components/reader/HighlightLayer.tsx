// components/reader/HighlightLayer.tsx
// Runs as a useEffect after ChapterRenderer mounts.
// Fetches the current user's highlights for the chapter, resolves each
// anchor back to a DOM Range via resolveAnchor(), and wraps fresh ranges
// in <mark class="highlight"> elements.
//
// Stale highlights (isStale = true from resolveAnchor, or is_stale = true
// from the DB) are NOT rendered into the DOM — they are passed to the
// onStaleFound callback so StaleHighlightBanner can display them.
//
// Re-runs when:
//   - documentId changes (chapter navigation)
//   - refreshKey changes (after a new highlight is saved by SelectionToolbar)
//
// The component renders nothing itself — all output is DOM mutation
// inside containerRef.

'use client'

import { useEffect, useRef } from 'react'
import { resolveAnchor } from '@/lib/annotations/resolveAnchor'

interface StoredHighlight {
  id: string
  paragraph_key: string
  start_offset: number
  end_offset: number
  selected_text: string
  color: string
  note: string | null
  is_public: boolean
  is_stale: boolean
}

interface HighlightLayerProps {
  documentId: string
  containerRef: React.RefObject<HTMLElement | null>
  // Increment this from the parent to force a re-fetch + re-render.
  // SelectionToolbar calls onHighlight() which bumps this key.
  refreshKey?: number
  onStaleFound?: (staleHighlights: StoredHighlight[]) => void
}

export default function HighlightLayer({
  documentId,
  containerRef,
  refreshKey = 0,
  onStaleFound,
}: HighlightLayerProps) {

  // Track which highlight ids have already been rendered so a re-run
  // after refreshKey bump doesn't double-wrap existing marks
  const renderedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!containerRef.current || !documentId) return

    let cancelled = false

    async function run() {
      // ── 1. Fetch highlights for this chapter ──────────────
      // Route: GET /api/annotations/highlights/document/[documentId]
      // Note: NOT /api/annotations/highlights/[documentId] — that path
      // was split to avoid Next.js dynamic slug conflicts with the [id]
      // PATCH/DELETE route.
      const res = await fetch(`/api/annotations/highlights/document/${documentId}`)
      if (cancelled) return

      if (!res.ok) {
        console.error('[HighlightLayer] fetch failed:', res.status)
        return
      }

      const { highlights }: { highlights: StoredHighlight[] } = await res.json()
      if (cancelled || !highlights.length) return

      // ── 2. Separate stale (DB-flagged) from candidates ────
      const dbStale    = highlights.filter(h => h.is_stale)
      const candidates = highlights.filter(h => !h.is_stale)

      const domStale: StoredHighlight[] = []

      // ── 3. Render fresh highlights ────────────────────────
      const container = containerRef.current!

      for (const highlight of candidates) {
        // Skip already-rendered marks (happens on refreshKey bump)
        if (renderedIds.current.has(highlight.id)) continue

        const result = resolveAnchor(
          {
            paragraph_key: highlight.paragraph_key,
            start_offset:  highlight.start_offset,
            end_offset:    highlight.end_offset,
            selected_text: highlight.selected_text,
          },
          container
        )

        if (!result) {
          // Paragraph was deleted entirely — treat as stale
          domStale.push(highlight)
          continue
        }

        if (result.isStale) {
          domStale.push(highlight)
          // Mark stale in DB so next load doesn't re-attempt resolution
          markStaleInDb(highlight.id)
          continue
        }

        // Wrap range in <mark>
        try {
          const mark = document.createElement('mark')
          mark.dataset.highlightId = highlight.id
          mark.className = 'highlight'
          mark.style.backgroundColor = highlight.color
          mark.title = highlight.note ?? ''
          result.range.surroundContents(mark)
          renderedIds.current.add(highlight.id)
        } catch {
          // surroundContents throws when the range spans inline element
          // boundaries (bold, italic, etc.) even within a single paragraph.
          // This is a known DOM limitation — skip silently.
          // The highlight will show as stale on next load once the DB is updated.
          console.warn(
            `[HighlightLayer] surroundContents failed for highlight ${highlight.id} — likely spans inline element boundary`
          )
        }
      }

      // ── 4. Report all stale highlights to parent ──────────
      const allStale = [...dbStale, ...domStale]
      if (allStale.length > 0) {
        onStaleFound?.(allStale)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [documentId, refreshKey, containerRef])

  // Cleanup: remove all rendered marks when documentId changes
  useEffect(() => {
    renderedIds.current.clear()

    return () => {
      // On unmount or chapter switch, strip all marks from DOM
      if (containerRef.current) {
        containerRef.current.querySelectorAll('mark.highlight').forEach(mark => {
          const parent = mark.parentNode
          if (!parent) return
          while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
          parent.removeChild(mark)
        })
      }
      renderedIds.current.clear()
    }
  }, [documentId])

  return null
}

// ── Helper — fire-and-forget DB stale update ─────────────────────
// Non-blocking. If it fails, the next page load will try again.
// Route: PATCH /api/annotations/highlights/[id]
function markStaleInDb(highlightId: string) {
  fetch(`/api/annotations/highlights/${highlightId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_stale: true }),
  }).catch(() => {
    // Silent — non-critical
  })
}