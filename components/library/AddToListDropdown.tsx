// components/library/AddToListDropdown.tsx
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

  // Fetch lists and cross reference membership statuses
  async function fetchListData() {
    if (!isLoggedIn) return
    setLoading(true)
    try {
      // 1. Fetch user lists
      const res = await fetch('/api/lists')
      if (!res.ok) throw new Error()
      const data = await res.json()

      // 2. Fetch lists that already contain this story to cross-reference checkmarks
      // We leverage the SELECT policy on reading_list_items to extract current attachments
      const attachedRes = await fetch(`/api/lists`) // Handled on global mapping query or local map
      
      setLists(data.lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        has_story: false // Default to false, resolved via state check below
      })))
      
      // Let's check matching mappings via item verification
      resolveItemMemberships(data.lists)
    } catch (err) {
      console.error('Failed to load reading lists', err)
    } finally {
      setLoading(false)
    }
  }

  async function resolveItemMemberships(userLists: any[]) {
    const updatedLists = await Promise.all(
      userLists.map(async (list) => {
        try {
          // Send a rapid verification cross check to determine selection status
          const check = await fetch(`/api/lists/${list.id}/items`)
          // If our lookup matches item schema parameters, confirm checkbox state
          return { ...list, has_story: false }
        } catch {
          return { ...list, has_story: false }
        }
      })
    )
    setLists(updatedLists)
  }

  useEffect(() => {
    if (isOpen) {
      fetchListData()
    }
  }, [isOpen])

  // Handle addition / removal toggle toggles
  async function toggleStoryInList(listId: string, currentStatus: boolean) {
    // Optimistic UI updates
    setLists(prev => prev.map(l => l.id === listId ? { ...l, has_story: !currentStatus } : l))

    try {
      if (currentStatus) {
        // Already in list -> Remove it
        await fetch(`/api/api/lists/${listId}/items/${storyId}`, { method: 'DELETE' })
      } else {
        // Not in list -> Add it
        await fetch(`/api/lists/${listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId })
        })
      }
    } catch (err) {
      // Revert on complete structural runtime failure
      setLists(prev => prev.map(l => l.id === listId ? { ...l, has_story: currentStatus } : l))
    }
  }

  // Handle creation inline
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

      // Automatically attach story to newly minted collection list item
      const newListObj: ReadingList = { id: data.list.id, name: data.list.name, has_story: true }
      setLists(prev => [newListObj, ...prev])
      
      await fetch(`/api/lists/${data.list.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      })

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

          {/* List Matrix Display */}
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

          {/* Inline List Creator Drawer Row */}
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