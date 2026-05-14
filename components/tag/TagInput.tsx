// components/tag/TagInput.tsx
// Writer-side tag input with autocomplete dropdown.
// Used in StepDetails (publish wizard) and ManagePublishing.

'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { normalizeTag } from '@/lib/utils/normalizeTag'

const CURATED: string[] = [
  'enemies-to-lovers', 'slow-burn', 'found-family', 'chosen-one',
  'redemption-arc', 'anti-hero', 'forbidden-love', 'dark', 'cozy',
  'bittersweet', 'hopeful', 'atmospheric', 'fast-paced', 'magic-system',
  'space-opera', 'post-apocalyptic', 'urban-fantasy', 'dystopian',
  'mythology', 'lgbtq', 'diverse-cast', 'own-voices',
]

interface TagInputProps {
  tags:     string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

export default function TagInput({ tags, onChange, maxTags = 5 }: TagInputProps) {
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open,        setOpen]        = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions from API when query or open state changes
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const url = query.trim()
          ? `/api/tags/suggest?q=${encodeURIComponent(query)}`
          : '/api/tags/suggest'
        const res  = await fetch(url, { signal: controller.signal })
        const data = await res.json()
        const names: string[] = (data.tags ?? []).map((t: any) => t.name)
        const filtered = (names.length > 0 ? names : CURATED)
          .filter((n) => !tags.includes(n))
          .slice(0, 8)
        setSuggestions(filtered)
      } catch {
        // aborted — ignore
      }
    }, 150)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, open, tags])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current   && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function addTag(raw: string) {
    const name = normalizeTag(raw)
    if (!name || tags.includes(name) || tags.length >= maxTags) return
    onChange([...tags, name])
    setQuery('')
    inputRef.current?.focus()
  }

  function removeTag(name: string) {
    onChange(tags.filter((t) => t !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) { e.preventDefault(); addTag(query.trim()) }
    if (e.key === 'Backspace' && !query && tags.length > 0) removeTag(tags[tags.length - 1])
    if (e.key === 'Escape') setOpen(false)
  }

  const atMax = tags.length >= maxTags

  return (
    <div className="space-y-2">
      {/* Pill + input box */}
      <div
        className="flex flex-wrap gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-lg focus-within:ring-2 focus-within:ring-amber-400/50 focus-within:border-amber-400 transition-all min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-xs rounded-full font-['Inter']"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? 'type to search or add…' : ''}
            className="flex-1 min-w-[120px] text-sm font-['Inter'] text-stone-700 bg-transparent outline-none placeholder:text-stone-300"
          />
        )}

        <span className="ml-auto text-xs text-stone-400 font-['Inter'] self-center flex-shrink-0">
          {tags.length}/{maxTags}
        </span>
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && !atMax && (
        <div
          ref={dropdownRef}
          className="bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-stone-100">
            <span className="text-xs text-stone-400 font-['Inter']">
              {query ? 'Matching tags' : 'Popular suggestions'}
            </span>
          </div>
          <div className="py-1 max-h-48 overflow-y-auto">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(name) }}
                className="w-full text-left px-3 py-2 text-sm font-['Inter'] text-stone-700 hover:bg-amber-50 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Static suggestion pills when closed + not at max */}
      {!open && !atMax && (
        <div className="flex flex-wrap gap-1.5">
          {CURATED
            .filter((s) => !tags.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-['Inter'] text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-300 rounded-full transition-colors"
              >
                <Plus size={9} />
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}