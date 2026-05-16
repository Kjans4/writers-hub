// components/library/BookmarksTabContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Bookmark, Trash2, Calendar } from 'lucide-react'
import Image from 'next/image'

interface BookmarkItem {
  id: string
  document_id: string
  story_id: string
  chapter_number: number
  chapter_title: string
  story_slug: string
  story_title: string
  story_cover_url: string | null
  created_at: string
}

export default function BookmarksTabContent() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch('/api/bookmarks')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setBookmarks(data.bookmarks || [])
      } catch (err) {
        console.error('Failed to load bookmarks:', err)
      } {
        setLoading(false)
      }
    }
    fetchBookmarks()
  }, [])

  async function handleRemoveBookmark(documentId: string, e: React.MouseEvent) {
    e.stopPropagation() // Prevent navigating to the chapter when clicking delete
    
    try {
      const res = await fetch(`/api/bookmarks/${documentId}`, {
        method: 'POST', // Our toggle route handles deletion on POST if already present
      })
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.document_id !== documentId))
      }
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-stone-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-stone-200 rounded-2xl max-w-xl mx-auto px-6 bg-stone-50/50">
        <Bookmark size={32} className="mx-auto text-stone-300 mb-3" />
        <h3 className="text-sm font-semibold text-stone-700 font-['Inter']">No bookmarks saved</h3>
        <p className="text-xs text-stone-400 font-['Inter'] mt-1 max-w-xs mx-auto">
          Click the bookmark icon while reading chapters to quickly save your place here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          onClick={() => router.push(`/story/${bookmark.story_slug}/chapter/${bookmark.document_id}`)}
          className="group border border-stone-100 rounded-2xl p-3 flex items-center gap-4 bg-white hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer relative"
        >
          {/* Story Cover Thumbnail */}
          <div className="w-12 h-16 bg-stone-100 rounded-lg relative overflow-hidden flex-shrink-0 border border-stone-200/60 shadow-sm">
            {bookmark.story_cover_url ? (
              <Image
                src={bookmark.story_cover_url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-stone-200" />
            )}
          </div>

          {/* Text Metadata Details */}
          <div className="flex-1 min-w-0 pr-16 font-['Inter']">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 block mb-0.5">
              Ch. {bookmark.chapter_number} — {bookmark.chapter_title}
            </span>
            <h3 className="font-semibold text-stone-800 text-sm truncate group-hover:text-stone-950 transition-colors">
              {bookmark.story_title}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1">
              <Calendar size={11} />
              <span>Saved {new Date(bookmark.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Quick Remove Action Button */}
          <button
            onClick={(e) => handleRemoveBookmark(bookmark.document_id, e)}
            className="absolute right-4 p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Remove bookmark"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}