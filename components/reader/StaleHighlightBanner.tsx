// components/reader/StaleHighlightBanner.tsx
// Shows a warning banner when one or more of the reader's highlights
// have gone stale (the author updated the chapter after they were saved).
//
// Displays:
//   - Count of stale highlights
//   - Each stale highlight's selected_text (truncated) with a Remove button
//   - "Clear all stale" option
//
// All deletes call DELETE /api/annotations/highlights/[id].
// The banner disappears when all stale highlights have been removed.
//
// Props:
//   staleHighlights  — array passed up from HighlightLayer via onStaleFound
//   onDismissed      — called after all stale highlights are cleared,
//                      so the parent can hide the banner

'use client'

import { useState } from 'react'
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react'

interface StaleHighlight {
  id: string
  selected_text: string
  paragraph_key: string
}

interface StaleHighlightBannerProps {
  staleHighlights: StaleHighlight[]
  onDismissed: () => void
}

export default function StaleHighlightBanner({
  staleHighlights,
  onDismissed,
}: StaleHighlightBannerProps) {
  const [remaining, setRemaining]     = useState<StaleHighlight[]>(staleHighlights)
  const [deleting, setDeleting]       = useState<Set<string>>(new Set())
  const [clearingAll, setClearingAll] = useState(false)

  if (remaining.length === 0) return null

  // ── Remove a single stale highlight ──────────────────────
  async function handleRemove(id: string) {
    setDeleting(prev => new Set(prev).add(id))

    try {
      await fetch(`/api/annotations/highlights/${id}`, { method: 'DELETE' })
    } catch {
      // Silent on network error — optimistic removal still proceeds
    }

    setDeleting(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    const next = remaining.filter(h => h.id !== id)
    setRemaining(next)
    if (next.length === 0) onDismissed()
  }

  // ── Clear all stale highlights ────────────────────────────
  async function handleClearAll() {
    setClearingAll(true)

    await Promise.allSettled(
      remaining.map(h =>
        fetch(`/api/annotations/highlights/${h.id}`, { method: 'DELETE' })
      )
    )

    setClearingAll(false)
    setRemaining([])
    onDismissed()
  }

  return (
    <div className="max-w-[680px] mx-auto mb-6 px-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-sm font-['Inter'] text-amber-800 font-medium">
              {remaining.length === 1
                ? '1 highlight may have shifted'
                : `${remaining.length} highlights may have shifted`}
            </p>
          </div>

          <button
            onClick={handleClearAll}
            disabled={clearingAll}
            className="flex items-center gap-1.5 text-xs font-['Inter'] text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50"
          >
            {clearingAll
              ? <Loader2 size={11} className="animate-spin" />
              : <Trash2 size={11} />
            }
            Clear all
          </button>
        </div>

        {/* Explanation */}
        <p className="px-4 pt-3 pb-1 text-xs font-['Inter'] text-amber-700 leading-relaxed">
          The author updated this chapter after you saved these highlights.
          The words may have moved or changed.
        </p>

        {/* Stale list */}
        <div className="px-4 pb-3 space-y-2 mt-2">
          {remaining.map(highlight => (
            <div
              key={highlight.id}
              className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2"
            >
              {/* Stale text preview */}
              <p className="flex-1 text-sm font-serif text-stone-500 italic line-through truncate">
                "{highlight.selected_text.length > 80
                  ? highlight.selected_text.slice(0, 80) + '…'
                  : highlight.selected_text}"
              </p>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(highlight.id)}
                disabled={deleting.has(highlight.id)}
                className="flex items-center gap-1 text-xs font-['Inter'] text-stone-400 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {deleting.has(highlight.id)
                  ? <Loader2 size={11} className="animate-spin" />
                  : <X size={11} />
                }
                Remove
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}