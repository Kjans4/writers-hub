// components/feed/StoryCard.tsx
// Story card used across home feed, genre pages, tag pages, search results.
// Phase D update: shows ★ score when ratings_count >= 5.

import Link from 'next/link'
import { Star } from 'lucide-react'
import CoverPlaceholder from './CoverPlaceholder'
import GenreBadge from '@/components/genre/GenreBadge'
import TagList from '@/components/tag/TagList'

interface StoryCardProps {
  story: {
    id:              string
    slug:            string
    title:           string
    hook?:           string | null
    cover_url?:      string | null
    status?:         string
    genre_name?:     string | null
    genre_slug?:     string | null
    genre_color?:    string | null
    tag_names?:      string[]
    author_name?:    string | null
    author_username?: string | null
    // Phase D — optional, not all call sites pass these yet
    ratings_score?:  number | null
    ratings_count?:  number
  }
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-violet-600 text-white',
  hiatus:    'bg-amber-500 text-white',
}

const MIN_RATINGS_TO_SHOW = 5

export default function StoryCard({ story }: StoryCardProps) {
  const showRating =
    story.ratings_count != null &&
    story.ratings_count >= MIN_RATINGS_TO_SHOW &&
    story.ratings_score != null

  return (
    <Link href={`/story/${story.slug}`} className="group flex flex-col">

      {/* Cover */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-sm border border-stone-100 group-hover:shadow-md transition-shadow">
        {story.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.cover_url}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <CoverPlaceholder storyId={story.id} title={story.title} />
        )}

        {story.status && STATUS_BADGE[story.status] && (
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-['Inter'] capitalize ${STATUS_BADGE[story.status]}`}>
              {story.status}
            </span>
          </div>
        )}

        {/* Star rating badge — bottom left of cover */}
        {showRating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            <Star size={10} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-xs text-white font-['Inter'] font-medium">
              {story.ratings_score!.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-stone-800 font-['Inter'] leading-snug line-clamp-2 mb-0.5 group-hover:text-amber-700 transition-colors">
        {story.title}
      </p>

      {/* Author */}
      {story.author_name && (
        <p className="text-xs text-stone-400 font-['Inter'] mb-2">
          {story.author_name}
        </p>
      )}

      {/* Genre badge */}
      {story.genre_name && story.genre_slug && story.genre_color && (
        <div className="mb-1.5">
          <GenreBadge
            name={story.genre_name}
            slug={story.genre_slug}
            color={story.genre_color}
          />
        </div>
      )}

      {/* Tag pills — max 3 */}
      {story.tag_names && story.tag_names.length > 0 && (
        <TagList tags={story.tag_names} max={3} />
      )}
    </Link>
  )
}