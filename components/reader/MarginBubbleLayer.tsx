// components/reader/MarginBubbleLayer.tsx
// Fetches the bubble summary for a chapter and positions ●N MarginBubble
// components absolutely to the right of each paragraph that has comments.
//
// Architecture:
//   - Renders a zero-width, full-height absolutely-positioned column to
//     the right of the prose container. Bubbles never displace text.
//   - After mount, measures the offsetTop of each [data-paragraph-key]
//     element to place bubbles at the correct vertical position.
//   - Re-measures on window resize.
//   - Clicking a bubble fires onOpenDrawer(paragraphKey) so the parent
//     (ChapterAnnotationShell) can open MarginDrawer.
//
// Props:
//   documentId     — chapter document UUID
//   containerRef   — ref to the prose container div (ChapterAnnotationShell's div)
//   onOpenDrawer   — called with paragraphKey when a bubble is clicked
//   refreshKey     — increment to force a re-fetch after a new comment is posted

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import MarginBubble from './MarginBubble'

interface BubbleSummary {
  paragraph_key: string
  count: number
  has_mine: boolean
}

interface BubblePosition extends BubbleSummary {
  top: number  // px offset from top of containerRef
}

interface MarginBubbleLayerProps {
  documentId:    string
  containerRef:  React.RefObject<HTMLElement | null>
  onOpenDrawer:  (paragraphKey: string) => void
  refreshKey?:   number
}

export default function MarginBubbleLayer({
  documentId,
  containerRef,
  onOpenDrawer,
  refreshKey = 0,
}: MarginBubbleLayerProps) {
  const [bubbles, setBubbles]     = useState<BubbleSummary[]>([])
  const [positions, setPositions] = useState<BubblePosition[]>([])
  const layerRef = useRef<HTMLDivElement>(null)

  // ── Fetch bubble summary ──────────────────────────────────
  useEffect(() => {
    if (!documentId) return
    let cancelled = false

    async function fetchSummary() {
      try {
        // Route: GET /api/annotations/inline-comments/[id]/summary
        // where [id] = documentId
        const res = await fetch(
          `/api/annotations/inline-comments/${documentId}/summary`
        )
        if (cancelled || !res.ok) return
        const { bubbles: data } = await res.json()
        if (!cancelled) setBubbles(data ?? [])
      } catch {
        // Non-fatal — bubbles simply won't appear
      }
    }

    fetchSummary()
    return () => { cancelled = true }
  }, [documentId, refreshKey])

  // ── Measure paragraph positions and map to bubbles ────────
  const measurePositions = useCallback(() => {
    if (!containerRef.current || bubbles.length === 0) {
      setPositions([])
      return
    }

    const container = containerRef.current
    const containerTop = container.getBoundingClientRect().top + window.scrollY

    const mapped: BubblePosition[] = []

    for (const bubble of bubbles) {
      const el = container.querySelector(
        `[data-paragraph-key="${bubble.paragraph_key}"]`
      ) as HTMLElement | null

      if (!el) continue

      const rect = el.getBoundingClientRect()
      const top = rect.top + window.scrollY - containerTop

      mapped.push({
        ...bubble,
        top: Math.max(0, top),
      })
    }

    setPositions(mapped)
  }, [bubbles, containerRef])

  // Re-measure whenever bubbles change or window resizes
  useEffect(() => {
    // Small timeout so the DOM has painted before we measure
    const timer = setTimeout(measurePositions, 80)
    window.addEventListener('resize', measurePositions)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measurePositions)
    }
  }, [measurePositions])

  if (positions.length === 0) return null

  return (
    // Absolute column flush to the right of the prose container.
    // pointer-events: none on the container so prose selection is unaffected.
    // Each bubble re-enables pointer-events for itself.
    <div
      ref={layerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        // 40px to the right of the prose — enough clearance not to overlap text
        right: -40,
        width: 28,
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {positions.map((bubble) => (
        <div
          key={bubble.paragraph_key}
          style={{
            position:      'absolute',
            top:           bubble.top,
            right:         0,
            pointerEvents: 'auto',
          }}
        >
          <MarginBubble
            count={bubble.count}
            has_mine={bubble.has_mine}
            top={0}
            onClick={() => onOpenDrawer(bubble.paragraph_key)}
          />
        </div>
      ))}
    </div>
  )
}