// app/library/page.tsx
// Library page — two tabs:
//   Bookmarks     — saved chapter positions (Phase C)
//   Reading Lists — custom curated lists (want-to-read, favourites, etc.)
//
// Fix E: tab labels now accurately describe their contents.
// "Reading Lists" makes it clear that custom lists (want-to-read,
// favourites, etc.) all live under one tab — users create and name
// their own lists rather than having fixed system categories.

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Bookmark, FolderHeart } from 'lucide-react'
import ReadingListsTab from '@/components/library/ReadingListsTab'
import BookmarksTabContent from '@/components/library/BookmarksTabContent'

export default function LibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentTab = searchParams.get('tab') === 'lists' ? 'lists' : 'bookmarks'
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'lists'>(currentTab)

  useEffect(() => {
    setActiveTab(currentTab)
  }, [currentTab])

  const handleTabChange = (tab: 'bookmarks' | 'lists') => {
    setActiveTab(tab)
    router.push(`/library?tab=${tab}`)
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 font-['Inter']">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Your Library
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Your saved bookmarks and reading lists.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-stone-200 mb-8 pb-px">
        <button
          onClick={() => handleTabChange('bookmarks')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative border-b-2 -mb-px ${
            activeTab === 'bookmarks'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <Bookmark size={15} className={activeTab === 'bookmarks' ? 'fill-current' : ''} />
          Bookmarks
        </button>

        <button
          onClick={() => handleTabChange('lists')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative border-b-2 -mb-px ${
            activeTab === 'lists'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          <FolderHeart size={15} />
          Reading Lists
        </button>
      </div>

      {/* Active tab content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'bookmarks' ? (
          <BookmarksTabContent />
        ) : (
          <ReadingListsTab />
        )}
      </div>
    </main>
  )
}