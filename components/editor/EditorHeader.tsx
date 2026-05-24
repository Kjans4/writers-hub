// components/editor/EditorHeader.tsx
// FIX BUG-005: Illegal setState During Render
//   The previous code called `setLocalTitle(title)` directly in the component
//   body (render phase) to sync the input when the parent title prop changed.
//   This violates React's rules — setState during render causes a warning and
//   can trigger infinite render loops on chapter switches. It also read
//   `document.activeElement` during render which throws on the server (SSR).
//   Fixed by moving the sync into a `useEffect` that depends on `title`.
//
// Updated for Phase 6: adds checkpoint button (Flag icon) and
// timeline toggle button (Clock icon) to the header row.

'use client'

import { useState, useRef, useEffect } from 'react'
import { Focus, Minimize2, Flag, Clock } from 'lucide-react'

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  focusMode: boolean
  onToggleFocusMode: () => void
  onOpenCheckpoint: () => void
  onToggleTimeline: () => void
  timelineOpen: boolean
}

export default function EditorHeader({
  title,
  onTitleChange,
  focusMode,
  onToggleFocusMode,
  onOpenCheckpoint,
  onToggleTimeline,
  timelineOpen,
}: EditorHeaderProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  // FIX BUG-005: was called directly in the render body —
  //   `if (localTitle !== title && document.activeElement !== inputRef.current) { setLocalTitle(title) }`
  // Moved into a useEffect so it only runs after render, avoiding the
  // illegal-setState-during-render violation and the SSR document access.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalTitle(title)
    }
  }, [title])

  function handleBlur() {
    const trimmed = localTitle.trim()
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed)
    }
    if (!trimmed) setLocalTitle(title)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setLocalTitle(title)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative max-w-[680px] mx-auto mb-8">
      {/* Title row */}
      <div className="flex items-start gap-2">
        <input
          ref={inputRef}
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 font-serif text-3xl font-bold text-stone-800 bg-transparent border-none outline-none placeholder:text-stone-300 leading-tight"
          placeholder="Untitled chapter"
          spellCheck={false}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 mt-1.5 flex-shrink-0">
          {/* Timeline toggle */}
          <button
            onClick={onToggleTimeline}
            title="Chapter timeline"
            className={`
              p-1.5 rounded transition-colors
              ${timelineOpen
                ? 'text-amber-600 bg-amber-50'
                : 'text-stone-300 hover:text-stone-500'}
            `}
          >
            <Clock size={14} />
          </button>

          {/* Checkpoint */}
          <button
            onClick={onOpenCheckpoint}
            title="Save checkpoint (⌘⇧S)"
            className="p-1.5 text-stone-300 hover:text-amber-500 transition-colors rounded"
          >
            <Flag size={14} />
          </button>

          {/* Focus mode */}
          <button
            onClick={onToggleFocusMode}
            title={focusMode ? 'Exit focus mode' : 'Focus mode (⌘.)'}
            className="p-1.5 text-stone-300 hover:text-stone-500 transition-colors rounded"
          >
            {focusMode ? <Minimize2 size={14} /> : <Focus size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}