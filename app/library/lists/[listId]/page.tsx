// app/library/lists/[listId]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Loader2, FolderOpen, Book } from 'lucide-react'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ listId: string }>
}

export default function ListDetailPage({ params }: PageProps) {
  // Safe Next.js forward-compatible parameter unwrapping
  const { listId } = use(params) 
  const router = useRouter()
  
  const [listData, setListData] = useState<any>(null)
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function loadDetails() {
      try {
        const res = await fetch(`/api/lists/${listId}`)
        if (!res.ok) {
          // If the list doesn't exist or isn't owned by the user, eject back safely
          router.push('/library?tab=lists')
          return
        }
        const data = await res.json()
        setListData(data.list)
        setStories(data.stories)
      } catch (err) {
        console.error('Error compiling list details view:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [listId, router])

  async function handleDeleteList() {
    if (!confirm('Are you sure you want to delete this reading list? The stories themselves won\'t be affected.')) return
    
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/lists/${listId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/library?tab=lists')
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to drop reading list:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleRemoveStory(storyId: string, e: React.MouseEvent) {
    e.stopPropagation() // Prevents opening the story details page when clicking remove
    
    try {
      const res = await fetch(`/api/lists/${listId}/items/${storyId}`, { method: 'DELETE' })
      if (res.ok) {
        // Optimistically remove from state
        setStories(prev => prev.filter(s => s.id !== storyId))
      }
    } catch (err) {
      console.error('Failed to remove story item from list:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-stone-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 font-['Inter'] animate-in fade-in duration-200">
      
      {/* Dynamic Action Navigation Line */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/library?tab=lists')}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Library
        </button>

        <button
          onClick={handleDeleteList}
          disabled={deleteLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium disabled:opacity-40"
        >
          {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete List
        </button>
      </div>

      {/* List Meta Header */}
      <div className="flex items-center gap-3.5 mb-8 pb-6 border-b border-stone-100">
        <div className="w-12 h-12 bg-stone-900 text-white flex items-center justify-center rounded-2xl shadow-sm flex-shrink-0">
          <FolderOpen size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-stone-900 tracking-tight truncate">{listData?.name}</h1>
          <p className="text-xs text-stone-400 mt-0.5">{stories.length} {stories.length === 1 ? 'story' : 'stories'} curated</p>
        </div>
      </div>

      {/* Curated Feed Matrix */}
      {stories.length === 0 ? (
        <div className="text-center py-20 text-stone-400 bg-stone-50/50 rounded-2xl border border-stone-100 border-dashed">
          <Book size={24} className="mx-auto mb-2 text-stone-300" />
          <p className="text-xs">No stories saved in this list yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => router.push(`/story/${story.slug}`)}
              className="group border border-stone-100 rounded-2xl p-3 flex items-center gap-4 bg-white hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer relative"
            >
              {/* Cover Image Placeholder */}
              <div className="w-12 h-16 bg-stone-100 rounded-lg relative overflow-hidden flex-shrink-0 border border-stone-200/60 shadow-sm">
                {story.cover_url ? (
                  <Image src={story.cover_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 bg-stone-200" />
                )}
              </div>

              {/* Story Details */}
              <div className="flex-1 min-w-0 pr-20">
                <h3 className="font-semibold text-stone-800 text-sm truncate group-hover:text-stone-950 transition-colors">
                  {story.title}
                </h3>
                <p className="text-xs text-stone-400 truncate mt-0.5 max-w-lg">
                  {story.summary || "No description provided."}
                </p>
              </div>

              {/* Individual Item Deletion Row Button */}
              <button
                onClick={(e) => handleRemoveStory(story.id, e)}
                className="absolute right-4 text-xs text-stone-400 hover:text-red-600 px-2.5 py-1.5 hover:bg-red-50 rounded-lg transition-all font-medium"
                title="Remove from list"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}