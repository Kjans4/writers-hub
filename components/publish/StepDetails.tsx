// components/publish/StepDetails.tsx
// Step 1 of the publish wizard.
// Phase A update: adds Genre dropdown (required) and Tag input (optional).
// Next button is disabled until both title and genre_id are set.

'use client'

import { useEffect, useState } from 'react'
import { ContentRating, StoryStatus, Genre } from '@/lib/supabase/types'
import { WizardData } from './PublishWizard'
import TagInput from '@/components/tag/TagInput'
import { ChevronDown } from 'lucide-react'

interface StepDetailsProps {
  data:     WizardData
  onChange: (partial: Partial<WizardData>) => void
  onNext:   () => void
  onCancel: () => void
}

const RATINGS: { value: ContentRating; label: string; description: string }[] = [
  { value: 'all_ages', label: 'All Ages', description: 'Suitable for everyone'         },
  { value: 'teen',     label: 'Teen',     description: 'Mild themes, no explicit content' },
  { value: 'mature',   label: 'Mature',   description: 'Adult themes or language'      },
]

const STATUSES: { value: StoryStatus; label: string }[] = [
  { value: 'ongoing',   label: 'Ongoing'   },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus',    label: 'Hiatus'    },
]

export default function StepDetails({ data, onChange, onNext, onCancel }: StepDetailsProps) {
  const [genres, setGenres] = useState<Genre[]>([])
  const hookLength = data.hook.length
  const descLength = data.description.length
  const canProceed = data.title.trim().length > 0 && !!data.genre_id

  useEffect(() => {
    fetch('/api/genres')
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-7">

      <div>
        <h2 className="font-serif text-xl text-stone-800 mb-1">Story Details</h2>
        <p className="text-sm text-stone-400 font-['Inter']">
          This information appears on your public story page and in search results.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
          Story Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="The Glass Meridian"
          className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
        />
      </div>

      {/* Hook */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
          One-line Hook
        </label>
        <input
          type="text"
          value={data.hook}
          onChange={(e) => { if (e.target.value.length <= 120) onChange({ hook: e.target.value }) }}
          placeholder="A cartographer who maps impossible places discovers the world has edges."
          className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-stone-300 font-['Inter']">Shown on story cards.</p>
          <span className={`text-xs font-['Inter'] ${hookLength > 100 ? 'text-amber-500' : 'text-stone-300'}`}>
            {hookLength}/120
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
          Full Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => { if (e.target.value.length <= 800) onChange({ description: e.target.value }) }}
          rows={4}
          placeholder="The full blurb readers see on your story page…"
          className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs font-['Inter'] ${descLength > 700 ? 'text-amber-500' : 'text-stone-300'}`}>
            {descLength}/800
          </span>
        </div>
      </div>

      {/* Content Rating */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 font-['Inter']">
          Content Rating
        </label>
        <div className="space-y-2">
          {RATINGS.map(({ value, label, description }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  data.content_rating === value
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-stone-300 group-hover:border-stone-400'
                }`}
                onClick={() => onChange({ content_rating: value })}
              >
                {data.content_rating === value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div onClick={() => onChange({ content_rating: value })}>
                <span className="text-sm text-stone-700 font-['Inter']">{label}</span>
                <span className="text-xs text-stone-400 font-['Inter'] ml-2">{description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Genre — required */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
          Genre <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={data.genre_id ?? ''}
            onChange={(e) => onChange({ genre_id: e.target.value || null })}
            className="w-full appearance-none px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all pr-9 cursor-pointer"
          >
            <option value="">Select a genre…</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>
        {!data.genre_id && (
          <p className="text-xs text-stone-300 font-['Inter'] mt-1">
            Required — helps readers find your story.
          </p>
        )}
      </div>

      {/* Tags — optional */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
          Tags{' '}
          <span className="text-stone-300 normal-case font-normal">(optional — up to 5)</span>
        </label>
        <TagInput
          tags={data.tags ?? []}
          onChange={(tags) => onChange({ tags })}
        />
      </div>

      {/* Story Status */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 font-['Inter']">
          Story Status
        </label>
        <div className="flex gap-2">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ status: value })}
              className={`px-4 py-2 rounded-lg text-sm font-['Inter'] border transition-colors ${
                data.status === value
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}