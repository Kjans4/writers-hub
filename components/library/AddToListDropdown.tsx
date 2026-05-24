// components/library/AddToListDropdown.tsx
// FIX BUG-002: Wrong API path — `/api/api/lists/...` → `/api/lists/...`
//   The DELETE call for removing a story from a list had a double `/api/api/`
//   prefix, causing every removal to 404 and silently revert after the
//   optimistic UI update.
//
// FIX BUG-003: Membership check always returned false
//   `resolveItemMemberships` fetched `/api/lists` (the list index) instead of
//   `/api/lists/${list.id}/items`, then returned `has_story: false`
//   unconditionally regardless of the response. Checkmarks never appeared.
//   Fixed by fetching the correct endpoint and checking whether `storyId`
//   appears in the returned items array.

'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, ListPlus, Folder, Check, Loader2 } from 'lucide-react'

interface AddToListDropdownProps {
  storyId: string
  isLoggedIn: boolean
}

interface ReadingList {
  id: string
  name: string
  has_story: boolean
}

export default function AddToListDropdown({ storyId, isLoggedIn }: AddToListDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [lists, setLists] = useState<ReadingList[]>([])
  const [loading, setLoading] = useState(false)

  // Creation States
  const [isCreating, setIsCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
        setNewListName('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch lists and cross-reference membership statuses
  async function fetchListData() {
    if (!isLoggedIn) return
    setLoading(true)
    try {
      // 1. Fetch all user lists
      const res = await fetch('/api/lists')
      if (!res.ok) throw new Error()
      const data = await res.json()

      // 2. For each list, fetch its items and check if storyId is present
      // FIX BUG-003: was fetching '/api/lists' (wrong endpoint) and always
      // returning has_story: false. Now fetches the correct items endpoint
      // and checks the returned array for the current storyId.
      const listsWithMembership = await Promise.all(
        (data.lists ?? []).map(async (list: any) => {
          try {
            const itemRes = await fetch(`/api/lists/${list.id}/items`)
            if (!itemRes.ok) return { ...list, has_story: false }
            const itemData = await itemRes.json()
            const has_story = (itemData.items ?? []).some(
              (item: any) => item.story_id === storyId
            )
            return { ...list, has_story }
          } catch {
            return { ...list, has_story: false }
          }
        })
      )

      setLists(listsWithMembership)
    } catch (err) {
      console.error('Failed to load reading lists', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchListData()
    }
  }, [isOpen])

  // Handle addition / removal toggle
  async function toggleStoryInList(listId: string, currentStatus: boolean) {
    // Optimistic UI update
    setLists(prev => prev.map(l => l.id === listId ? { ...l, has_story: !currentStatus } : l))

    try {
      if (currentStatus) {
        // Already in list → Remove it
        // FIX BUG-002: was `/api/api/lists/...` (double prefix), now correct path
        await fetch(`/api/lists/${listId}/items/${storyId}`, { method: 'DELETE' })
      } else {
        // Not in list → Add it
        await fetch(`/api/lists/${listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId })
        })
      }
    } catch (err) {
      // Revert optimistic update on failure
      setLists(prev => prev.map(l => l.id === listId ? { ...l, has_story: currentStatus } : l))
    }
  }

  // Handle inline list creation
  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListName.trim() || createLoading) return

    setCreateLoading(true)
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()

      // Automatically add story to the newly created list
      await fetch(`/api/lists/${data.list.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      })

      const newListObj: ReadingList = { id: data.list.id, name: data.list.name, has_story: true }
      setLists(prev => [newListObj, ...prev])
      setNewListName('')
      setIsCreating(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => isLoggedIn ? setIsOpen(!isOpen) : window.location.assign('/login')}
        className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-sm font-medium text-stone-700 font-['Inter'] transition-all"
      >
        <ListPlus size={16} />
        Save to List
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden font-['Inter'] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-stone-100 bg-stone-50/70">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Select Reading Lists</span>
          </div>

          {/* List items */}
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-stone-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-6 px-3 text-xs text-stone-400">
                You haven't created any reading lists yet.
              </div>
            ) : (
              lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => toggleStoryInList(list.id, list.has_story)}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder size={15} className="text-stone-400 group-hover:text-stone-600 transition-colors flex-shrink-0" />
                    <span className="truncate">{list.name}</span>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    list.has_story
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'border-stone-300 group-hover:border-stone-400'
                  }`}>
                    {list.has_story && <Check size={11} strokeWidth={3} />}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Inline list creator */}
          <div className="border-t border-stone-100 p-2 bg-stone-50/50">
            {isCreating ? (
              <form onSubmit={handleCreateList} className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  placeholder="List name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="flex-1 min-w-0 bg-white border border-stone-200 px-2 py-1 text-xs rounded-md focus:outline-none focus:border-stone-400 text-stone-800"
                  maxLength={32}
                />
                <button
                  type="submit"
                  disabled={!newListName.trim() || createLoading}
                  className="px-2 py-1 bg-stone-950 hover:bg-stone-800 text-white text-xs font-medium rounded-md disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  {createLoading ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium hover:bg-stone-100/70 rounded-md transition-colors"
              >
                <Plus size={13} />
                Create a new list
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}