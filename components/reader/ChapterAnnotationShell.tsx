// components/reader/ChapterAnnotationShell.tsx
// Client wrapper that owns the containerRef and mounts all annotation
// components (Phase A: highlights, Phase B: inline comments) around
// the chapter prose.
//
// Why this exists:
//   The parent server page stays a Server Component for data fetching
//   (auth, story, chapters, reading progress). This shell takes over
//   on the client for all interactive annotation behaviour.
//
//   The chapter HTML is passed down as a prop (already fetched server-side)
//   and rendered via dangerouslySetInnerHTML inside the ref'd div so both
//   HighlightLayer and MarginBubbleLayer can walk the DOM immediately after mount.
//
// Phase A: HighlightLayer, SelectionToolbar (Highlight action), StaleHighlightBanner
// Phase B: MarginBubbleLayer (●N bubbles), MarginDrawer (flat thread),
//          InlineCommentWrite (inline write box from toolbar Comment click)
//
// Props:
//   documentId   — chapter document UUID
//   isLoggedIn   — passed to annotation components to control logged-out states
//   chapterHtml  — raw TipTap HTML string from documents.content

'use client'

import { useRef, useState, useCallback } from 'react'
import SelectionToolbar from '@/components/reader/SelectionToolbar'
import HighlightLayer from '@/components/reader/HighlightLayer'
import StaleHighlightBanner from '@/components/reader/StaleHighlightBanner'
import MarginBubbleLayer from '@/components/reader/MarginBubbleLayer'
import MarginDrawer from '@/components/reader/MarginDrawer'
import InlineCommentWrite from '@/components/reader/InlineCommentWrite'
import { AnnotationAnchor } from '@/lib/annotations/captureAnchor'

interface StaleHighlight {
  id: string
  selected_text: string
  paragraph_key: string
}

interface ChapterAnnotationShellProps {
  documentId:  string
  isLoggedIn:  boolean
  chapterHtml: string
}

export default function ChapterAnnotationShell({
  documentId,
  isLoggedIn,
  chapterHtml,
}: ChapterAnnotationShellProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Phase A state ─────────────────────────────────────────
  // Bumped after a new highlight is saved — forces HighlightLayer to re-fetch
  const [highlightRefreshKey, setHighlightRefreshKey] = useState(0)
  // Stale highlights surfaced by HighlightLayer, shown in the banner above prose
  const [staleHighlights, setStaleHighlights] = useState<StaleHighlight[]>([])

  // ── Phase B state ─────────────────────────────────────────
  // Bumped after a comment is posted or deleted — forces MarginBubbleLayer to re-fetch
  const [bubbleRefreshKey, setBubbleRefreshKey] = useState(0)

  // MarginDrawer open state — which paragraphKey is open (null = closed)
  const [openDrawerKey, setOpenDrawerKey] = useState<string | null>(null)

  // InlineCommentWrite state — set when user clicks Comment in SelectionToolbar
  const [commentAnchor, setCommentAnchor]     = useState<AnnotationAnchor | null>(null)
  const [commentRect, setCommentRect]         = useState<DOMRect | null>(null)

  // ── Handlers ──────────────────────────────────────────────

  // Called by SelectionToolbar after saving a highlight
  function handleHighlightSaved() {
    setHighlightRefreshKey(k => k + 1)
  }

  // Called by SelectionToolbar when Comment button is clicked
  const handleCommentOpen = useCallback(
    (anchor: AnnotationAnchor, rect: DOMRect) => {
      setCommentAnchor(anchor)
      setCommentRect(rect)
    },
    []
  )

  // Called by InlineCommentWrite after a successful post
  function handleCommentPosted() {
    setCommentAnchor(null)
    setCommentRect(null)
    // Refresh bubbles so the new count appears immediately
    setBubbleRefreshKey(k => k + 1)
  }

  // Called by MarginBubbleLayer bubble click
  function handleOpenDrawer(paragraphKey: string) {
    setOpenDrawerKey(paragraphKey)
  }

  // Called by MarginDrawer after a post or delete
  function handleBubbleUpdate() {
    setBubbleRefreshKey(k => k + 1)
  }

  return (
    // relative so MarginBubbleLayer can position absolutely
    <div style={{ position: 'relative' }}>

      {/* Phase A — Stale highlight banner above prose */}
      {staleHighlights.length > 0 && (
        <StaleHighlightBanner
          staleHighlights={staleHighlights}
          onDismissed={() => setStaleHighlights([])}
        />
      )}

      {/* Chapter prose — ref'd so annotation layers can walk the DOM */}
      <div
        ref={containerRef}
        className="editor-content"
        dangerouslySetInnerHTML={{ __html: chapterHtml }}
      />

      {/* Phase A — Highlight layer: DOM mutation only, renders nothing itself */}
      <HighlightLayer
        documentId={documentId}
        containerRef={containerRef}
        refreshKey={highlightRefreshKey}
        onStaleFound={setStaleHighlights}
      />

      {/* Phase B — Margin bubble column: positioned to the right of prose */}
      <MarginBubbleLayer
        documentId={documentId}
        containerRef={containerRef}
        onOpenDrawer={handleOpenDrawer}
        refreshKey={bubbleRefreshKey}
      />

      {/* Phase A+B — Selection toolbar: floats above text selection */}
      <SelectionToolbar
        containerRef={containerRef}
        documentId={documentId}
        isLoggedIn={isLoggedIn}
        onHighlight={handleHighlightSaved}
        onComment={handleCommentOpen}
      />

      {/* Phase B — InlineCommentWrite: appears near selection after clicking Comment */}
      {commentAnchor && commentRect && (
        <InlineCommentWrite
          documentId={documentId}
          anchor={commentAnchor}
          selectionRect={commentRect}
          onPosted={handleCommentPosted}
          onCancel={() => {
            setCommentAnchor(null)
            setCommentRect(null)
          }}
        />
      )}

      {/* Phase B — MarginDrawer: slide-in thread for a paragraph */}
      {openDrawerKey && (
        <MarginDrawer
          documentId={documentId}
          paragraphKey={openDrawerKey}
          isLoggedIn={isLoggedIn}
          onClose={() => setOpenDrawerKey(null)}
          onBubbleUpdate={handleBubbleUpdate}
        />
      )}
    </div>
  )
}