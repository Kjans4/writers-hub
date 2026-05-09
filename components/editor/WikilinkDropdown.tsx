// components/editor/WikilinkDropdown.tsx
// Search dropdown shown when the user types [[.
// Searches existing entities by title (all types).
// Selecting an item inserts a wikilink node into the editor.
// Escape or clicking outside closes the dropdown.
// Also supports creating a new entity on the fly if no match is found.

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { createClient } from '@/lib/supabase/client'
import { Document, DocumentType } from '@/lib/supabase/types'
import { User, MapPin, Scroll, Package, Plus } from 'lucide-react'

interface WikilinkDropdownProps {
  editor: Editor | null
  projectId: string
  branchId: string
}

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  chapter:   <Scroll size={11} />,
  character: <User size={11} />,
  location:  <MapPin size={11} />,
  lore:      <Scroll size={11} />,
  object:    <Package size={11} />,
}

const TYPE_COLORS: Record<DocumentType, string> = {
  chapter:   'text-stone-400',
  character: 'text-violet-400',
  location:  'text-emerald-500',
  lore:      'text-amber-500',
  object:    'text-sky-400',
}

export default function WikilinkDropdown({
  editor,
  projectId,
  branchId,
}: WikilinkDropdownProps) {
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Document[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Listen for wikilink:search event ─────────────────────
  useEffect(() => {
    function handleOpen() {
      // Get cursor position for dropdown placement
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        })
      }
      setQuery('')
      setOpen(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    document.addEventListener('wikilink:search', handleOpen)
    return () => document.removeEventListener('wikilink:search', handleOpen)
  }, [])

  // ── Search entities as query changes ──────────────────────
  useEffect(() => {
    if (!open) return

    async function search() {
      if (!query.trim()) {
        // Show all non-chapter entities
        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .eq('branch_id', branchId)
          .neq('type', 'chapter')
          .order('title')
          .limit(20)

        setResults((data as Document[]) ?? [])
        setSelectedIndex(0)
        return
      }

      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)
        .neq('type', 'chapter')
        .ilike('title', `%${query}%`)
        .order('title')
        .limit(10)

      setResults((data as Document[]) ?? [])
      setSelectedIndex(0)
    }

    search()
  }, [query, open, projectId, branchId])

  // ── Insert wikilink and close ─────────────────────────────
  function insertWikilink(title: string) {
    if (!editor) return
    editor.chain().focus().insertWikilink(title).run()
    // Insert a space after the wikilink so typing continues naturally
    editor.chain().insertContent(' ').run()
    setOpen(false)
    setQuery('')
  }

  // ── Create new entity + insert wikilink ───────────────────
  async function createAndInsert(title: string, type: DocumentType = 'character') {
    if (!title.trim()) return

    const nextOrder = 0 // will be at top of its section

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        branch_id: branchId,
        type,
        title: title.trim(),
        content: '',
        order_index: nextOrder,
      })
      .select()
      .single()

    if (doc) {
      insertWikilink(doc.title)
    }
  }

  // ── Keyboard navigation ───────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex < results.length && results[selectedIndex]) {
        insertWikilink(results[selectedIndex].title)
      } else {
        // "Create new" row is selected
        createAndInsert(query)
      }
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      editor?.commands.focus()
    }
  }

  // ── Click outside closes dropdown ─────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!open) return null

  return (
    <div
      ref={dropdownRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-64 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Search input */}
      <div className="px-3 py-2 border-b border-stone-100">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search entities…"
          className="w-full text-sm font-['Inter'] text-stone-700 bg-transparent outline-none placeholder:text-stone-300"
        />
      </div>

      {/* Results */}
      <div className="max-h-56 overflow-y-auto py-1">
        {results.map((doc, i) => (
          <button
            key={doc.id}
            onMouseDown={(e) => {
              e.preventDefault()
              insertWikilink(doc.title)
            }}
            onMouseEnter={() => setSelectedIndex(i)}
            className={`
              w-full text-left px-3 py-2 flex items-center gap-2 transition-colors
              ${selectedIndex === i ? 'bg-amber-50' : 'hover:bg-stone-50'}
            `}
          >
            <span className={TYPE_COLORS[doc.type]}>
              {TYPE_ICONS[doc.type]}
            </span>
            <span className="text-sm font-['Inter'] text-stone-700 truncate">
              {doc.title}
            </span>
            <span className={`text-xs ml-auto capitalize font-['Inter'] ${TYPE_COLORS[doc.type]}`}>
              {doc.type}
            </span>
          </button>
        ))}

        {/* Create new row */}
        {query.trim() && (
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              createAndInsert(query.trim())
            }}
            onMouseEnter={() => setSelectedIndex(results.length)}
            className={`
              w-full text-left px-3 py-2 flex items-center gap-2 transition-colors
              ${selectedIndex === results.length ? 'bg-amber-50' : 'hover:bg-stone-50'}
            `}
          >
            <Plus size={11} className="text-amber-500" />
            <span className="text-sm font-['Inter'] text-amber-700">
              Create "{query.trim()}"
            </span>
          </button>
        )}

        {results.length === 0 && !query.trim() && (
          <p className="px-3 py-3 text-xs text-stone-300 font-['Inter']">
            No entities yet. Start typing to create one.
          </p>
        )}
      </div>
    </div>
  )
}