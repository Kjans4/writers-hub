// components/rating/DimensionStars.tsx
// A single row of 5 stars for one rating dimension.
// Stars fill on hover and lock on click.
// Each dimension is independent — clicking one does not affect others.
//
// Props:
//   label     — display label ("PROSE", "PLOT", etc.)
//   value     — current locked value (1–5), or null if unrated
//   onChange  — called with the new value when a star is clicked
//   readonly  — if true, renders as a static display (no hover/click)

'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface DimensionStarsProps {
  label:    string
  value:    number | null
  onChange: (value: number) => void
  readonly?: boolean
}

export default function DimensionStars({
  label,
  value,
  onChange,
  readonly = false,
}: DimensionStarsProps) {
  // hovered tracks which star the mouse is over (1-5), null when not hovering
  const [hovered, setHovered] = useState<number | null>(null)

  // The displayed fill level: hover takes priority over locked value
  const displayValue = hovered ?? value ?? 0

  return (
    <div className="flex items-center gap-3">
      {/* Dimension label */}
      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] w-24 flex-shrink-0">
        {label}
      </span>

      {/* Stars */}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => !readonly && setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onMouseEnter={() => !readonly && setHovered(star)}
              onClick={() => {
                if (readonly) return
                // Clicking the same star again clears the rating
                onChange(star === value ? 0 : star)
              }}
              className={`
                transition-transform
                ${readonly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110 active:scale-95'}
              `}
              aria-label={`Rate ${label} ${star} out of 5`}
            >
              <Star
                size={18}
                className={`transition-colors ${
                  filled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-stone-200 fill-stone-200'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Numeric label — only show when a value is locked */}
      {value !== null && value > 0 && (
        <span className="text-xs text-stone-400 font-['Inter'] w-4">
          {value}
        </span>
      )}
    </div>
  )
}