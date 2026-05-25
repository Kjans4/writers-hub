// components/rating/RatingPrompt.tsx
// FIX BUG-010: "Edit Your Rating" Button Doesn't Open the Edit Form
//   When `hasRated` was true and the reader clicked "Edit your rating",
//   the handler called `setSubmitted(false)`. But after that state update,
//   `hasRated` was still true and `submitted` was false — so the component
//   re-evaluated and rendered the "edit link" again instead of the rating form.
//   The full star-rating UI was completely unreachable for anyone who had
//   already rated.
//
//   Fix: added a dedicated `isEditing` boolean state. The "edit link" sets
//   it to true, which bypasses the `hasRated` early-return and shows the
//   full rating form pre-populated with existing values. Submitting or
//   dismissing resets `isEditing` back to false.
//
// Quiet inline section that appears at the bottom of the chapter page
// after a reader completes their 3rd chapter of a story.
//
// Rules:
//   - No modal — renders inline below chapter navigation
//   - Submit disabled until at least one dimension is rated
//   - "Maybe later" → POST /api/ratings/[storyId]/dismiss (upsert + increment)
//   - After 3 dismissals the prompt stops appearing (dismissed_count >= 3)
//   - If the reader has already rated, shows "Edit your rating" link instead
//   - After submit, shows a brief thank-you and hides

'use client'

import { useState } from 'react'
import DimensionStars from './DimensionStars'
import { Loader2, Star } from 'lucide-react'

interface ExistingRating {
  prose:           number | null
  plot:            number | null
  characters:      number | null
  pacing:          number | null
  world:           number | null
  dismissed_count: number
}

interface RatingPromptProps {
  storyId:        string
  completedCount: number
  existingRating: ExistingRating | null
  onRated?:       () => void
}

const DIMENSIONS: { key: keyof Omit<ExistingRating, 'dismissed_count'>; label: string }[] = [
  { key: 'prose',      label: 'Prose'      },
  { key: 'plot',       label: 'Plot'       },
  { key: 'characters', label: 'Characters' },
  { key: 'pacing',     label: 'Pacing'     },
  { key: 'world',      label: 'World'      },
]

type RatingState = {
  prose:      number | null
  plot:       number | null
  characters: number | null
  pacing:     number | null
  world:      number | null
}

export default function RatingPrompt({
  storyId,
  completedCount,
  existingRating,
  onRated,
}: RatingPromptProps) {
  const [ratings, setRatings] = useState<RatingState>({
    prose:      existingRating?.prose      ?? null,
    plot:       existingRating?.plot       ?? null,
    characters: existingRating?.characters ?? null,
    pacing:     existingRating?.pacing     ?? null,
    world:      existingRating?.world      ?? null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [dismissed,  setDismissed]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // FIX BUG-010: track whether the reader explicitly clicked "Edit your rating".
  // Without this flag, setting submitted=false when hasRated=true still renders
  // the "edit link" because hasRated is checked first — the form is unreachable.
  const [isEditing, setIsEditing] = useState(false)

  // Don't show if:
  //   - Fewer than 3 chapters completed
  //   - Already dismissed 3 times this session
  //   - Prompt was just dismissed this session
  if (completedCount < 3) return null
  if (dismissed) return null
  if (existingRating && existingRating.dismissed_count >= 3) return null

  const hasRated = existingRating &&
    (existingRating.prose      != null ||
     existingRating.plot       != null ||
     existingRating.characters != null ||
     existingRating.pacing     != null ||
     existingRating.world      != null)

  // Already rated and not currently editing — show the compact "edit" prompt.
  // FIX BUG-010: gate on `!isEditing` so clicking "Edit your rating" actually
  // shows the form instead of looping back to this early return.
  if (hasRated && !submitted && !isEditing) {
    return (
      <div className="max-w-[680px] mx-auto mt-10 mb-4 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />
          <p className="text-sm text-stone-500 font-['Inter']">
            You've rated this story.
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-amber-600 hover:text-amber-800 font-['Inter'] underline underline-offset-2 transition-colors flex-shrink-0"
        >
          Edit your rating
        </button>
      </div>
    )
  }

  // Thank-you state after submit
  if (submitted) {
    return (
      <div className="max-w-[680px] mx-auto mt-10 mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
        <Star size={13} className="text-amber-500 fill-amber-500 flex-shrink-0" />
        <p className="text-sm text-stone-600 font-['Inter']">
          Thanks for rating — your feedback helps other readers find great stories.
        </p>
      </div>
    )
  }

  const atLeastOne = Object.values(ratings).some((v) => v !== null && v > 0)

  function handleDimensionChange(key: keyof RatingState, value: number) {
    setRatings((prev) => ({
      ...prev,
      [key]: value === 0 ? null : value,
    }))
  }

  async function handleSubmit() {
    if (!atLeastOne || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/ratings/${storyId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(ratings),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Something went wrong.')
        return
      }

      setSubmitted(true)
      setIsEditing(false)
      onRated?.()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDismiss() {
    if (dismissing) return
    setDismissing(true)

    try {
      await fetch(`/api/ratings/${storyId}/dismiss`, { method: 'POST' })
    } catch {
      // Non-fatal — dismiss optimistically
    } finally {
      setDismissing(false)
      setDismissed(true)
      setIsEditing(false)
    }
  }

  return (
    <div
      id="rating-edit"
      className="max-w-[680px] mx-auto mt-12 mb-4 bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-stone-100">
        <p className="text-sm font-semibold text-stone-700 font-['Inter']">
          {isEditing
            ? 'Update your rating'
            : `You've read ${completedCount} chapters. How is it so far?`}
        </p>
        <p className="text-xs text-stone-400 font-['Inter'] mt-0.5">
          Rate any dimensions you feel confident about. You can update this anytime from the story page.
        </p>
      </div>

      {/* Stars */}
      <div className="px-6 py-5 space-y-3">
        {DIMENSIONS.map(({ key, label }) => (
          <DimensionStars
            key={key}
            label={label}
            value={ratings[key]}
            onChange={(v) => handleDimensionChange(key, v)}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 pb-2">
          <p className="text-xs text-red-500 font-['Inter']">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-4">
        <button
          onClick={isEditing ? () => setIsEditing(false) : handleDismiss}
          disabled={dismissing}
          className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors flex items-center gap-1.5"
        >
          {dismissing && <Loader2 size={11} className="animate-spin" />}
          {isEditing ? 'Cancel' : 'Maybe later'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={!atLeastOne || submitting}
          className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {isEditing ? 'Update Rating' : 'Submit Rating'}
        </button>
      </div>
    </div>
  )
}