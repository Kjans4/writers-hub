// components/editor/EditorHeader.tsx
// Editable chapter title rendered above the TipTap editor.
// Title saves on blur or Enter key via the updateDocument function.
// Also holds the Focus Mode toggle button.

'use client'

import { useState, useRef } from 'react'
import { Focus, Minimize2 } from 'lucide-react'

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  focusMode: boolean
  onToggleFocusMode: () => void
}

export default function EditorHeader({
  title,
  onTitleChange,
  focusMode,
  onToggleFocusMode,
}: EditorHeaderProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleBlur() {
    const trimmed = localTitle.trim()
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed)
    }
    // Revert if empty
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

  // Keep local state in sync when parent title changes (e.g. chapter switch)
  if (localTitle !== title && document.activeElement !== inputRef.current) {
    setLocalTitle(title)
  }

  return (
    <div className="relative flex items-start justify-between max-w-[680px] mx-auto mb-8">
      {/* Editable title */}
      <input
        ref={inputRef}
        type="text"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 font-serif text-3xl font-bold text-stone-800 bg-transparent border-none outline-none placeholder:text-stone-300 leading-tight pr-4"
        placeholder="Untitled chapter"
        spellCheck={false}
      />

      {/* Focus mode toggle */}
      <button
        onClick={onToggleFocusMode}
        title={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        className="mt-1 p-1.5 text-stone-300 hover:text-stone-500 transition-colors rounded flex-shrink-0"
      >
        {focusMode ? <Minimize2 size={15} /> : <Focus size={15} />}
      </button>
    </div>
  )
}