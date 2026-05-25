// components/editor/EditorHeader.tsx
// Updated to show live word count + reading time next to the action buttons.
// WordCount sits between the title input and the icon buttons — unobtrusive
// at idle (stone-300), readable on hover.
//
// Also carries forward FIX BUG-005: sync title via useEffect not render body.

'use client'

import { useState, useRef, useEffect } from 'react'
import { Focus, Minimize2, Flag, Clock } from 'lucide-react'
import WordCount from './WordCount'
import { Editor } from '@tiptap/react'

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  focusMode: boolean
  onToggleFocusMode: () => void
  onOpenCheckpoint: () => void
  onToggleTimeline: () => void
  timelineOpen: boolean
  // Wire the TipTap editor instance in so WordCount can derive its stats
  editor: Editor | null
}

export default function EditorHeader({
  title,
  onTitleChange,
  focusMode,
  onToggleFocusMode,
  onOpenCheckpoint,
  onToggleTimeline,
  timelineOpen,
  editor,
}: EditorHeaderProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  // BUG-005 fix: sync via useEffect, never in the render body
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

        {/* Right-side controls */}
        <div className="flex items-center gap-2 mt-2 flex-shrink-0">

          {/* Live word count — fades at idle, readable on hover */}
          <WordCount editor={editor} />

          {/* Divider — only shown when there are words */}
          {editor && <div className="w-px h-3.5 bg-stone-200" />}

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