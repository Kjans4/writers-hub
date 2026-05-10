// components/editor/EditorHeader.tsx
// Updated for Phase 6: adds checkpoint button (Flag icon) and
// timeline toggle button (Clock icon) to the header row.
// Replace your existing components/editor/EditorHeader.tsx with this file.

'use client'

import { useState, useRef } from 'react'
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

  // Sync when parent title changes (chapter switch)
  if (localTitle !== title && document.activeElement !== inputRef.current) {
    setLocalTitle(title)
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