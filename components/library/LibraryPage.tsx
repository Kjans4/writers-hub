// components/library/LibraryPage.tsx
'use client'

import { useState } from 'react'
import BookmarkCard from './BookmarkCard'

export interface BookmarkItem {
  id: string
  document_id: string
  story_id: string       // Fixes Issue C: Aligns client state with API payload
  chapter_number: number
  chapter_title: string
  story_slug: string
  story_title: string
  story_cover_url: string | null
  created_at: string
}

interface LibraryPageProps {
  initialBookmarks: BookmarkItem[]
}

export default function LibraryPage({ initialBookmarks }: LibraryPageProps) {
  // Setup tabs layout. Issue F: Cleaned up comments, only two functional tabs active.
  const [activeTab, setActiveTab] = useState<'reading_lists' | 'bookmarked'>('bookmarked')

  const handleRemoveBookmark = (bookmarkId: string) => {
    // Remove bookmark logic
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header View */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Your Library</h1>
      </div>

      {/* Tab Navigation Bars */}
      <div className="flex gap-6 border-b border-stone-200 mb-8">
        <button
          onClick={() => setActiveTab('reading_lists')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 font-['Inter'] ${
            activeTab === 'reading_lists'
              ? 'border-stone-800 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Reading Lists
        </button>
        <button
          onClick={() => setActiveTab('bookmarked')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 font-['Inter'] ${
            activeTab === 'bookmarked'
              ? 'border-stone-800 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Bookmarks ({initialBookmarks.length})
        </button>
      </div>

      {/* View Routing Panels */}
      {activeTab === 'reading_lists' ? (
        <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
          <p className="text-stone-500 font-['Inter'] text-sm">You haven't created any reading lists yet.</p>
        </div>
      ) : (
        <>
          {initialBookmarks.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
              <p className="text-stone-500 font-['Inter'] text-sm">Your bookmarked chapters will appear here.</p>
            </div>
          ) : (
            /* Responsive Cards Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} {...bookmark} onRemove={handleRemoveBookmark} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}