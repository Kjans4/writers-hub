// components/editor/InlineAutocomplete.tsx
// Renders the inline autocomplete UI.
//
// Single match  → ghost text: a muted span positioned at the cursor
//                showing the suffix of the matched entity name
//
// Multiple matches → small floating dropdown positioned below the cursor,
//                    styled to match WikilinkDropdown but distinct component
//
// Tab (or Enter in dropdown) → deletes the partial word, inserts wikilink node
// Escape → clears state (dismiss once behavior — handled in extension too)
// Arrow keys → navigate dropdown items
//
// Mounted inside Editor.tsx alongside other overlay components.

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Document, DocumentType } from '@/lib/supabase/types'
import { AutocompleteSuggestDetail } from './extensions/InlineAutocompleteExtension'
import { User, MapPin, Scroll, Package } from 'lucide-react'

interface InlineAutocompleteProps {
  editor: Editor | null
}

// Maps entity type → icon (same palette as WikilinkDropdown)
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

interface SuggestionState {
  query: string
  matches: Document[]
  cursorRect: DOMRect
  wordStart: number
}

export default function InlineAutocomplete({ editor }: InlineAutocompleteProps) {
  const [suggestion, setSuggestion] = useState<SuggestionState | null>(null)
  const [dropdownIndex, setDropdownIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Listen for extension events ───────────────────────────
  useEffect(() => {
    function handleSuggest(e: Event) {
      const detail = (e as CustomEvent<AutocompleteSuggestDetail>).detail
      setSuggestion({
        query: detail.query,
        matches: detail.matches,
        cursorRect: detail.cursorRect,
        wordStart: detail.wordStart,
      })
      setDropdownIndex(0)
    }

    function handleClear() {
      setSuggestion(null)
    }

    document.addEventListener('autocomplete:suggest', handleSuggest)
    document.addEventListener('autocomplete:clear', handleClear)
    return () => {
      document.removeEventListener('autocomplete:suggest', handleSuggest)
      document.removeEventListener('autocomplete:clear', handleClear)
    }
  }, [])

  // ── Accept a suggestion: delete partial word, insert wikilink ──
  const acceptSuggestion = useCallback(
    (title: string, wordStart: number) => {
      if (!editor) return

      const { from } = editor.state.selection

      // 1. Delete the partial word the writer typed
      editor
        .chain()
        .focus()
        .deleteRange({ from: wordStart, to: from })
        // 2. Insert the wikilink node (uses existing WikilinkExtension command)
        .insertWikilink(title)
        // 3. Add a trailing space so writing continues naturally
        .insertContent(' ')
        .run()

      setSuggestion(null)
    },
    [editor]
  )

  // ── Global Tab / Arrow / Enter / Escape handler ───────────
  useEffect(() => {
    if (!suggestion) return

    function handleKeyDown(e: KeyboardEvent) {
      if (!suggestion) return
      const isSingleMatch = suggestion.matches.length === 1

      if (e.key === 'Tab') {
        e.preventDefault()
        // Single match → accept it directly
        // Multiple matches → accept the highlighted dropdown item
        const target = isSingleMatch
          ? suggestion.matches[0]
          : suggestion.matches[dropdownIndex]
        if (target) acceptSuggestion(target.title, suggestion.wordStart)
        return
      }

      if (e.key === 'Enter' && !isSingleMatch) {
        e.preventDefault()
        const target = suggestion.matches[dropdownIndex]
        if (target) acceptSuggestion(target.title, suggestion.wordStart)
        return
      }

      if (e.key === 'ArrowDown' && !isSingleMatch) {
        e.preventDefault()
        setDropdownIndex((i) => Math.min(i + 1, suggestion.matches.length - 1))
        return
      }

      if (e.key === 'ArrowUp' && !isSingleMatch) {
        e.preventDefault()
        setDropdownIndex((i) => Math.max(i - 1, 0))
        return
      }

      if (e.key === 'Escape') {
        setSuggestion(null)
        // Note: the extension also sets dismissed=true on Escape,
        // so the same word won't re-trigger until the writer types
        // a different word.
      }
    }

    window.addEventListener('keydown', handleKeyDown, true) // capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [suggestion, dropdownIndex, acceptSuggestion])

  if (!suggestion) return null

  const isSingleMatch = suggestion.matches.length === 1
  const singleMatch = suggestion.matches[0]

  // Position: use the cursor's bounding rect + scrollY offset
  const scrollY = window.scrollY

  // ── Ghost text (single match) ─────────────────────────────
  if (isSingleMatch && singleMatch) {
    const suffix = singleMatch.title.slice(suggestion.query.length)
    if (!suffix) return null   // exact match already — nothing to ghost

    return (
      <span
        style={{
          position: 'fixed',
          top: suggestion.cursorRect.top,
          left: suggestion.cursorRect.right,
          // Match the editor's font exactly so ghost text aligns with cursor
          fontFamily: 'var(--font-lora), Georgia, serif',
          fontSize: '18px',
          lineHeight: '1.8',
          color: '#a8a29e',   // stone-400 — muted but visible
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 40,
          // Small hint label so the writer knows what Tab does
        }}
        aria-hidden="true"
      >
        {suffix}
        <span
          style={{
            marginLeft: '8px',
            fontFamily: 'var(--font-inter), sans-serif',
            fontSize: '11px',
            color: '#d6d3d1',   // stone-300
            background: '#f5f5f4',
            border: '1px solid #e7e5e4',
            borderRadius: '4px',
            padding: '1px 5px',
            verticalAlign: 'middle',
          }}
        >
          Tab
        </span>
      </span>
    )
  }

  // ── Dropdown (multiple matches) ───────────────────────────
  // Positioned below the cursor, left-aligned to it
  const dropdownTop  = suggestion.cursorRect.bottom + 4
  const dropdownLeft = Math.max(
    8,
    Math.min(suggestion.cursorRect.left, window.innerWidth - 260 - 8)
  )

  return (
    <div
      ref={dropdownRef}
      style={{ top: dropdownTop, left: dropdownLeft }}
      className="fixed z-50 w-64 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header hint */}
      <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between">
        <span className="text-xs text-stone-400 font-['Inter']">
          Entity suggestions
        </span>
        <span className="text-xs text-stone-300 font-['Inter']">
          Tab to insert
        </span>
      </div>

      {/* Match list */}
      <div className="py-1 max-h-52 overflow-y-auto">
        {suggestion.matches.map((doc, i) => (
          <button
            key={doc.id}
            onMouseDown={(e) => {
              // mousedown instead of click so it fires before editor blur
              e.preventDefault()
              acceptSuggestion(doc.title, suggestion.wordStart)
            }}
            onMouseEnter={() => setDropdownIndex(i)}
            className={`
              w-full text-left px-3 py-2 flex items-center gap-2 transition-colors
              ${dropdownIndex === i ? 'bg-amber-50' : 'hover:bg-stone-50'}
            `}
          >
            <span className={TYPE_COLORS[doc.type]}>
              {TYPE_ICONS[doc.type]}
            </span>
            <span className="text-sm font-['Inter'] text-stone-700 flex-1 truncate">
              {/* Bold the matched prefix, normal weight for the suffix */}
              <span className="font-semibold">
                {doc.title.slice(0, suggestion.query.length)}
              </span>
              {doc.title.slice(suggestion.query.length)}
            </span>
            <span className={`text-xs capitalize font-['Inter'] flex-shrink-0 ${TYPE_COLORS[doc.type]}`}>
              {doc.type}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-stone-100">
        <p className="text-xs text-stone-300 font-['Inter']">
          ↑↓ navigate · Tab/Enter insert · Esc dismiss
        </p>
      </div>
    </div>
  )
}