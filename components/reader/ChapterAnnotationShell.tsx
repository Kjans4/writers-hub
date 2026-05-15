// components/reader/ChapterAnnotationShell.tsx
// Client wrapper that owns the containerRef and mounts the three
// annotation components around the chapter prose.
//
// Why this exists:
//   The parent server page stays a Server Component for data fetching
//   (auth, story, chapters, reading progress). This shell takes over
//   on the client for all interactive annotation behaviour.
//
//   The chapter HTML is passed down as a prop (already fetched server-side)
//   and rendered via dangerouslySetInnerHTML inside the ref'd div so the
//   HighlightLayer can walk the DOM immediately after mount.
//
// Props:
//   documentId   — chapter document UUID (used by all three annotation components)
//   isLoggedIn   — passed to SelectionToolbar to control logged-out tooltip
//   chapterHtml  — raw TipTap HTML string from documents.content

'use client'

import { useRef, useState } from 'react'
import SelectionToolbar from '@/components/reader/SelectionToolbar'
import HighlightLayer from '@/components/reader/HighlightLayer'
import StaleHighlightBanner from '@/components/reader/StaleHighlightBanner'

interface StaleHighlight {
  id: string
  selected_text: string
  paragraph_key: string
}

interface ChapterAnnotationShellProps {
  documentId: string
  isLoggedIn: boolean
  chapterHtml: string
}

export default function ChapterAnnotationShell({
  documentId,
  isLoggedIn,
  chapterHtml,
}: ChapterAnnotationShellProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Bumped after a new highlight is saved — forces HighlightLayer to re-fetch
  const [highlightRefreshKey, setHighlightRefreshKey] = useState(0)

  // Stale highlights surfaced by HighlightLayer, shown in the banner above prose
  const [staleHighlights, setStaleHighlights] = useState<StaleHighlight[]>([])

  return (
    <>
      {/* Stale highlight banner — sits above the chapter prose */}
      {staleHighlights.length > 0 && (
        <StaleHighlightBanner
          staleHighlights={staleHighlights}
          onDismissed={() => setStaleHighlights([])}
        />
      )}

      {/* Chapter prose — ref'd so annotation components can walk the DOM */}
      <div
        ref={containerRef}
        className="editor-content"
        dangerouslySetInnerHTML={{ __html: chapterHtml }}
      />

      {/* Highlight layer — DOM mutation only, renders nothing itself */}
      <HighlightLayer
        documentId={documentId}
        containerRef={containerRef}
        refreshKey={highlightRefreshKey}
        onStaleFound={setStaleHighlights}
      />

      {/* Selection toolbar — floats above the reader's text selection */}
      <SelectionToolbar
        containerRef={containerRef}
        documentId={documentId}
        isLoggedIn={isLoggedIn}
        onHighlight={() => setHighlightRefreshKey(k => k + 1)}
      />
    </>
  )
}