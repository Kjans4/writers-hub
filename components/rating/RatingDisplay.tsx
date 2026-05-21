// components/rating/RatingDisplay.tsx
// Aggregate community rating display shown on the story info page.
//
// Shows:
//   - Overall ★ score + rating count (only when ratings_count >= 5)
//   - Per-dimension breakdown with RatingBars
//   - "Your Rating" section if the reader has already rated, with Edit button
//     that scrolls/links to the RatingPrompt on the chapter page
//
// Props:
//   ratingsScore    — from published_stories.ratings_score (nullable)
//   ratingsCount    — from published_stories.ratings_count
//   storyId         — for fetching the reader's own rating
//   isLoggedIn      — controls whether "Your Rating" section appears

'use client'

import { useEffect, useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import RatingBars from './RatingBars'
import DimensionStars from './DimensionStars'

interface AggregateRating {
  prose:      number | null
  plot:       number | null
  characters: number | null
  pacing:     number | null
  world:      number | null
  total:      number
  overall:    number | null
}

interface MyRating {
  prose:      number | null
  plot:       number | null
  characters: number | null
  pacing:     number | null
  world:      number | null
}

interface RatingDisplayProps {
  ratingsScore: number | null
  ratingsCount: number
  storyId:      string
  isLoggedIn:   boolean
}

const DIMENSION_LABELS = [
  { key: 'prose'      as const, label: 'Prose'      },
  { key: 'plot'       as const, label: 'Plot'       },
  { key: 'characters' as const, label: 'Characters' },
  { key: 'pacing'     as const, label: 'Pacing'     },
  { key: 'world'      as const, label: 'World'      },
]

const MIN_RATINGS_TO_SHOW = 5

export default function RatingDisplay({
  ratingsScore,
  ratingsCount,
  storyId,
  isLoggedIn,
}: RatingDisplayProps) {
  const [aggregate, setAggregate] = useState<AggregateRating | null>(null)
  const [myRating, setMyRating]   = useState<MyRating | null>(null)
  const [loading, setLoading]     = useState(true)

  // ── Fetch aggregate + own rating ──────────────────────────
  useEffect(() => {
    if (!storyId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [aggRes, mineRes] = await Promise.all([
          fetch(`/api/ratings/${storyId}`),
          isLoggedIn ? fetch(`/api/ratings/${storyId}/mine`) : Promise.resolve(null),
        ])

        if (cancelled) return

        if (aggRes.ok) {
          const data = await aggRes.json()
          if (!cancelled) setAggregate(data.aggregate ?? null)
        }

        if (mineRes && mineRes.ok) {
          const data = await mineRes.json()
          if (!cancelled) setMyRating(data.rating ?? null)
        }
      } catch {
        // Non-fatal
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [storyId, isLoggedIn])

  // Nothing to show if no ratings yet and not logged in
  if (!loading && ratingsCount === 0 && !isLoggedIn) return null

  const showScore   = ratingsCount >= MIN_RATINGS_TO_SHOW && ratingsScore !== null
  const showBars    = ratingsCount >= MIN_RATINGS_TO_SHOW && aggregate !== null
  const hasMyRating = myRating &&
    (myRating.prose != null || myRating.plot != null ||
     myRating.characters != null || myRating.pacing != null ||
     myRating.world != null)

  // Don't render anything meaningful if no data and no personal rating
  if (!loading && !showScore && !hasMyRating) return null

  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
        Ratings
      </h2>
      <div className="w-full h-px bg-stone-200 mb-5" />

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={16} className="text-stone-300 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Community aggregate — only when count >= 5 */}
          {showScore && (
            <div>
              <div className="flex items-baseline gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                  <span className="font-serif text-2xl font-bold text-stone-800">
                    {ratingsScore!.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-stone-400 font-['Inter']">
                  {ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'}
                </span>
              </div>

              {showBars && (
                <RatingBars
                  dimensions={DIMENSION_LABELS.map(({ key, label }) => ({
                    label,
                    score: aggregate![key],
                  }))}
                />
              )}
            </div>
          )}

          {/* Low-count placeholder */}
          {!showScore && ratingsCount > 0 && (
            <p className="text-xs text-stone-400 font-['Inter']">
              {ratingsCount} {ratingsCount === 1 ? 'reader has' : 'readers have'} rated this story.
              Score shown after {MIN_RATINGS_TO_SHOW} ratings.
            </p>
          )}

          {/* Reader's own rating */}
          {isLoggedIn && hasMyRating && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3">
                Your Rating
              </p>
              <div className="space-y-2.5">
                {DIMENSION_LABELS.map(({ key, label }) => (
                  myRating![key] != null && (
                    <DimensionStars
                      key={key}
                      label={label}
                      value={myRating![key]}
                      onChange={() => {}}
                      readonly
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Not yet rated nudge */}
          {isLoggedIn && !hasMyRating && ratingsCount === 0 && (
            <p className="text-xs text-stone-300 font-['Inter']">
              No ratings yet. Read 3 chapters to leave yours.
            </p>
          )}

        </div>
      )}
    </section>
  )
}