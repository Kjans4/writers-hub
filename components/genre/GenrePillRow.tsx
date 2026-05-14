// components/genre/GenrePillRow.tsx
// Horizontally scrollable genre pill row — used on /home above the feed.
// Selecting a pill pushes ?genre=slug to the URL.
// Must be a Client Component — uses useSearchParams.

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Genre } from '@/lib/supabase/types'

interface GenrePillRowProps {
  genres: Genre[]
}

export default function GenrePillRow({ genres }: GenrePillRowProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeSlug   = searchParams.get('genre') ?? ''

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('genre', slug)
    } else {
      params.delete('genre')
    }
    router.push(`/home?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {/* All pill */}
      <button
        onClick={() => select('')}
        className={`
          flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-['Inter'] font-medium
          transition-colors border
          ${!activeSlug
            ? 'bg-stone-800 text-white border-stone-800'
            : 'text-stone-500 border-stone-200 hover:border-stone-300 hover:text-stone-700'}
        `}
      >
        All
      </button>

      {genres.map((genre) => {
        const isActive = activeSlug === genre.slug
        return (
          <button
            key={genre.id}
            onClick={() => select(genre.slug)}
            style={isActive
              ? { backgroundColor: genre.color, borderColor: genre.color, color: '#fff' }
              : { borderColor: '#e7e5e4' }
            }
            className={`
              flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-['Inter'] font-medium
              transition-colors border
              ${!isActive ? 'text-stone-500 hover:text-stone-700 hover:border-stone-300' : ''}
            `}
          >
            {genre.name}
          </button>
        )
      })}
    </div>
  )
}