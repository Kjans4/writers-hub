// components/publish/StepChapters.tsx
// Step 3 of the publish wizard.
// Writer selects which chapters to publish.
// All Canon chapters are shown; already-published ones are pre-checked.
// At least one chapter must be selected to enable Publish.

'use client'

import { useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'

interface Chapter {
  id: string
  title: string
  order_index: number | null
  is_published: boolean
}

interface StepChaptersProps {
  chapters:   Chapter[]
  selectedIds: string[]
  onChange:   (ids: string[]) => void
  onPublish:  (ids: string[]) => Promise<void>
  onBack:     () => void
  loading:    boolean
}

export default function StepChapters({
  chapters,
  selectedIds,
  onChange,
  onPublish,
  onBack,
  loading,
}: StepChaptersProps) {
  // Initialize selection: pre-check already-published chapters on first render
  const [localSelected, setLocalSelected] = useState<Set<string>>(() => {
    if (selectedIds.length > 0) return new Set(selectedIds)
    // Default: pre-check chapters that are already published
    return new Set(chapters.filter((c) => c.is_published).map((c) => c.id))
  })

  function toggle(id: string) {
    const next = new Set(localSelected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setLocalSelected(next)
    onChange(Array.from(next))
  }

  function toggleAll() {
    if (localSelected.size === chapters.length) {
      setLocalSelected(new Set())
      onChange([])
    } else {
      const all = new Set(chapters.map((c) => c.id))
      setLocalSelected(all)
      onChange(Array.from(all))
    }
  }

  async function handlePublish() {
    const ids = Array.from(localSelected)
    await onPublish(ids)
  }

  const selectedCount = localSelected.size
  const canPublish    = selectedCount > 0

  return (
    <div className="space-y-7">

      <div>
        <h2 className="font-serif text-xl text-stone-800 mb-1">
          Choose Chapters to Publish
        </h2>
        <p className="text-sm text-stone-400 font-['Inter']">
          Readers will only see published chapters. You can publish more anytime.
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen size={28} className="text-stone-200 mb-3" />
          <p className="text-sm text-stone-400 font-['Inter']">
            No chapters in your Canon branch yet.
          </p>
          <p className="text-xs text-stone-300 font-['Inter'] mt-1">
            Go back to the editor and create some chapters first.
          </p>
        </div>
      ) : (
        <>
          {/* Select all toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-['Inter']">
              {selectedCount} of {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={toggleAll}
              className="text-xs text-amber-600 hover:text-amber-800 font-['Inter'] transition-colors"
            >
              {localSelected.size === chapters.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {/* Chapter list */}
          <div className="space-y-2">
            {chapters.map((chapter, index) => {
              const isSelected = localSelected.has(chapter.id)
              return (
                <label
                  key={chapter.id}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
                    transition-colors
                    ${isSelected
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'}
                  `}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => toggle(chapter.id)}
                    className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                      transition-colors
                      ${isSelected
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-stone-300'}
                    `}
                  >
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => toggle(chapter.id)}
                  >
                    <span className="text-xs text-stone-400 font-['Inter']">
                      Chapter {index + 1}
                    </span>
                    <p className={`text-sm font-['Inter'] truncate ${isSelected ? 'text-stone-800' : 'text-stone-600'}`}>
                      {chapter.title || '[Untitled]'}
                    </p>
                  </div>

                  {chapter.is_published && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-['Inter'] flex-shrink-0">
                      Published
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {/* Summary */}
          {selectedCount > 0 && (
            <div className="px-4 py-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-xs text-stone-500 font-['Inter']">
                ✓{' '}
                <span className="font-medium text-stone-700">
                  {selectedCount} chapter{selectedCount !== 1 ? 's' : ''}
                </span>{' '}
                will be published and visible to readers immediately.
              </p>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={handlePublish}
          disabled={!canPublish || loading}
          className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Publishing…
            </>
          ) : (
            'Publish Story ✓'
          )}
        </button>
      </div>
    </div>
  )
}