// components/genre/GenrePage.tsx
// Genre browse page layout — client component for filter/sort interactions.

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Genre, StoryCardData } from '@/lib/supabase/types'
import StoryCard from '@/components/feed/StoryCard'
import TagPill from '@/components/tag/TagPill'
import { ChevronDown } from 'lucide-react'

interface GenrePageProps {
  genre:         Genre
  stories:       StoryCardData[]
  popularTags:   string[]
  hasMore:       boolean
  currentPage:   number
  currentSort:   string
  currentStatus: string
  currentTag:    string
}

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest'     },
  { value: 'most_saved', label: 'Most Saved' },
  { value: 'most_read',  label: 'Most Read'  },
]

const STATUS_OPTIONS = [
  { value: '',          label: 'All'       },
  { value: 'ongoing',   label: 'Ongoing'   },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus',    label: 'Hiatus'    },
]

export default function GenrePage({
  genre, stories, popularTags, hasMore,
  currentPage, currentSort, currentStatus, currentTag,
}: GenrePageProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // reset pagination on filter change
    router.push(`/genre/${genre.slug}?${params.toString()}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Back */}
      <button
        onClick={() => router.push('/home')}
        className="text-sm text-stone-400 hover:text-stone-600 font-['Inter'] mb-6 transition-colors"
      >
        ← Home
      </button>

      {/* Genre header */}
      <div className="mb-8">
        <h1
          className="font-serif text-3xl font-bold mb-1"
          style={{ color: genre.color }}
        >
          ✦ {genre.name.toUpperCase()}
        </h1>
        <p className="text-stone-400 text-sm font-['Inter']">
          {stories.length}{hasMore ? '+' : ''} {stories.length === 1 ? 'story' : 'stories'}
        </p>
      </div>

      {/* Popular tags in this genre */}
      {popularTags.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
            Popular Tags in {genre.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <TagPill
                key={tag}
                name={tag}
                onClick={() => updateParam('tag', currentTag === tag ? '' : tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sort + Status filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400 font-['Inter']">Sort by</span>
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-['Inter'] bg-white border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400 font-['Inter']">Status</span>
          <div className="relative">
            <select
              value={currentStatus}
              onChange={(e) => updateParam('status', e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-['Inter'] bg-white border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50 cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Active tag filter badge */}
        {currentTag && (
          <button
            onClick={() => updateParam('tag', '')}
            className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full font-['Inter'] hover:bg-amber-100 transition-colors"
          >
            #{currentTag} ×
          </button>
        )}
      </div>

      {/* Story grid */}
      {stories.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-stone-400 font-['Inter'] text-sm">No stories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => updateParam('page', String(currentPage + 1))}
            className="px-6 py-2.5 border border-stone-200 text-stone-600 text-sm font-['Inter'] rounded-xl hover:border-stone-300 hover:text-stone-800 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  )
}