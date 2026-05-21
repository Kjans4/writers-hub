// components/rating/RatingBars.tsx
// Fill bars showing per-dimension averages in the aggregate rating display.
// Each bar is a warm stone fill proportional to the 1–5 score.
// Used inside RatingDisplay on the story info page.

interface DimensionScore {
  label: string
  score: number | null  // average 1–5, or null if no ratings
}

interface RatingBarsProps {
  dimensions: DimensionScore[]
}

export default function RatingBars({ dimensions }: RatingBarsProps) {
  return (
    <div className="space-y-2.5">
      {dimensions.map(({ label, score }) => {
        const pct = score !== null ? ((score - 1) / 4) * 100 : 0
        const hasScore = score !== null

        return (
          <div key={label} className="flex items-center gap-3">
            {/* Label */}
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] w-24 flex-shrink-0">
              {label}
            </span>

            {/* Bar track */}
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: hasScore ? `${pct}%` : '0%' }}
              />
            </div>

            {/* Score */}
            <span className="text-xs text-stone-500 font-['Inter'] w-6 text-right flex-shrink-0">
              {hasScore ? score!.toFixed(1) : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}