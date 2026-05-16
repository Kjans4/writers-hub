// components/library/ReadingListsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Folder, Loader2, BookOpen, ChevronRight } from 'lucide-react'

export default function ReadingListsTab() {
  const router = useRouter()
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLists() {
      try {
        const res = await fetch('/api/lists')
        if (!res.ok) throw new Error()
        const data = await res.json()
        
        // For each list, hit its item endpoint to get the count
        const listsWithCounts = await Promise.all(
          data.lists.map(async (list: any) => {
            try {
              const itemRes = await fetch(`/api/lists/${list.id}/items`)
              if (!itemRes.ok) return { ...list, count: 0 }
              const itemData = await itemRes.json()
              return { ...list, count: itemData.items?.length || 0 }
            } catch {
              return { ...list, count: 0 }
            }
          })
        )
        setLists(listsWithCounts)
      } catch (err) {
        console.error('Failed to load reading lists drawer:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLists()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-stone-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-stone-200 rounded-2xl max-w-xl mx-auto px-6 bg-stone-50/50">
        <Folder size={32} className="mx-auto text-stone-300 mb-3" />
        <h3 className="text-sm font-semibold text-stone-700 font-['Inter']">No reading lists yet</h3>
        <p className="text-xs text-stone-400 font-['Inter'] mt-1 max-w-xs mx-auto">
          Create collections while reading or browsing story profiles to curating your layout dashboard space.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {lists.map((list) => (
        <div
          key={list.id}
          onClick={() => router.push(`/library/lists/${list.id}`)}
          className="group relative border border-stone-200 rounded-2xl p-4 bg-white hover:border-stone-400 shadow-sm transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-all flex-shrink-0">
              <Folder size={20} className="transition-transform group-hover:scale-105" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-800 text-sm truncate font-['Inter'] group-hover:text-stone-950">
                {list.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-stone-400 font-['Inter'] mt-0.5">
                <BookOpen size={12} />
                <span>{list.count} {list.count === 1 ? 'story' : 'stories'}</span>
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}