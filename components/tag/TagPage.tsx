// components/tag/TagPage.tsx
// Tag browse page layout.

'use client'

import { useRouter } from 'next/navigation'
import { StoryCardData } from '@/lib/supabase/types'
import StoryCard from '@/components/feed/StoryCard'

interface TagPageProps {
  tagName:    string
  storyCount: number
  stories:    StoryCardData[]
}

export default function TagPage({ tagName, storyCount, stories }: TagPageProps) {
  const router = useRouter()

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <button
        onClick={() => router.back()}
        className="text-sm text-stone-400 hover:text-stone-600 font-['Inter'] mb-6 transition-colors"
      >
        ← Back
      </button>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-800 mb-1">
          #{tagName}
        </h1>
        <p className="text-stone-400 text-sm font-['Inter']">
          {storyCount} {storyCount === 1 ? 'story' : 'stories'} tagged {tagName}
        </p>
      </div>

      {stories.length === 0 ? (
        <p className="text-stone-400 font-['Inter'] text-sm">No stories yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  )
}