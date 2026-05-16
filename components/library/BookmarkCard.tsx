// components/library/BookmarkCard.tsx
// A single bookmarked chapter card shown in the /library Bookmarked tab.
//
// Displays:
//   - Story cover thumbnail (CoverPlaceholder fallback using story_id for
//     consistent color across all story surfaces)
//   - Story title as a navigation link
//   - "Ch. N — Chapter title"
//   - "Bookmarked [date]"
//   - "Continue →" button to the correct chapter URL
//   - Remove button (visible on hover) that calls the toggle POST endpoint

'use client'

import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import CoverPlaceholder from '@/components/feed/CoverPlaceholder'

interface BookmarkCardProps {
  id:              string
  document_id:     string
  story_id:        string   // published_stories.id — for CoverPlaceholder color
  chapter_number:  number
  chapter_title:   string
  story_slug:      string
  story_title:     string
  story_cover_url: string | null
  created_at:      string
  onRemove:        (id: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

export default function BookmarkCard({
  id,
  document_id,
  story_id,
  chapter_number,
  chapter_title,
  story_slug,
  story_title,
  story_cover_url,
  created_at,
  onRemove,
}: BookmarkCardProps) {
  const router = useRouter()

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      // Toggle endpoint: if bookmarked, POST deletes it
      await fetch(`/api/bookmarks/${document_id}`, { method: 'POST' })
      onRemove(id)
    } catch {
      // Non-fatal — card stays visible, user can retry
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all group">

      {/* Cover thumbnail */}
      <div
        className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => router.push(`/story/${story_slug}`)}
      >
        {story_cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story_cover_url}
            alt={story_title}
            className="w-full h-full object-cover"
          />
        ) : (
          // story_id (not document_id) gives the same color as all other
          // placeholders for this story across the feed, story page, author page
          <CoverPlaceholder storyId={story_id} title={story_title} />
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => router.push(`/story/${story_slug}`)}
          className="text-xs text-stone-400 font-['Inter'] hover:text-stone-600 transition-colors truncate block mb-0.5"
        >
          {story_title}
        </button>
        <p className="text-sm font-medium text-stone-800 font-['Inter'] truncate">
          Ch. {chapter_number} — {chapter_title}
        </p>
        <p className="text-xs text-stone-300 font-['Inter'] mt-0.5">
          Bookmarked {formatDate(created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() =>
            router.push(`/story/${story_slug}/chapter/${chapter_number}`)
          }
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg font-['Inter'] transition-colors"
        >
          Continue →
        </button>
        <button
          onClick={handleRemove}
          className="p-1.5 text-stone-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove bookmark"
        >
          <Bookmark size={13} className="fill-current" />
        </button>
      </div>
    </div>
  )
}