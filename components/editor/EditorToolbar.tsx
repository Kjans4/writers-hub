// components/editor/EditorToolbar.tsx
// Updated for Phase 5: Wand2 button now fires "editor:rewrite" DOM event
// instead of being a no-op stub. Editor.tsx listens for this event.
// Replace your existing components/editor/EditorToolbar.tsx with this file.

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Bold, Italic, Heading1, Heading2, Quote, Wand2 } from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

interface ToolbarPosition {
  top: number
  left: number
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!editor) return

    const { from, to } = editor.state.selection
    const isEmpty = from === to

    if (isEmpty) {
      setVisible(false)
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      setVisible(false)
      return
    }

    const range = domSelection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    if (!rect.width) {
      setVisible(false)
      return
    }

    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 260
    const scrollY = window.scrollY

    setPosition({
      top: rect.top + scrollY - 44,
      left: Math.max(
        8,
        Math.min(
          rect.left + rect.width / 2 - toolbarWidth / 2,
          window.innerWidth - toolbarWidth - 8
        )
      ),
    })
    setVisible(true)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.on('selectionUpdate', updatePosition)
    editor.on('blur', () => setVisible(false))
    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('blur', () => setVisible(false))
    }
  }, [editor, updatePosition])

  if (!editor || !visible) return null

  const btnBase = 'p-1.5 rounded transition-colors text-stone-500 hover:text-stone-800 hover:bg-stone-100'
  const btnActive = 'bg-stone-100 text-stone-800'

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => e.preventDefault()}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 flex items-center gap-0.5 bg-white border border-stone-200 rounded-lg shadow-lg px-1.5 py-1 select-none"
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
        className={`${btnBase} ${editor.isActive('bold') ? btnActive : ''}`}
        title="Bold (⌘B)"
      >
        <Bold size={14} />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
        className={`${btnBase} ${editor.isActive('italic') ? btnActive : ''}`}
        title="Italic (⌘I)"
      >
        <Italic size={14} />
      </button>

      <div className="w-px h-4 bg-stone-200 mx-0.5" />

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
        className={`${btnBase} ${editor.isActive('heading', { level: 1 }) ? btnActive : ''}`}
        title="Heading 1"
      >
        <Heading1 size={14} />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
        className={`${btnBase} ${editor.isActive('heading', { level: 2 }) ? btnActive : ''}`}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run() }}
        className={`${btnBase} ${editor.isActive('blockquote') ? btnActive : ''}`}
        title="Blockquote"
      >
        <Quote size={14} />
      </button>

      <div className="w-px h-4 bg-stone-200 mx-0.5" />

      {/* Rewrite — now fires editor:rewrite event */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          document.dispatchEvent(new CustomEvent('editor:rewrite', { bubbles: true }))
        }}
        className={`${btnBase} text-amber-500 hover:text-amber-700 hover:bg-amber-50`}
        title="Rewrite paragraph"
      >
        <Wand2 size={14} />
      </button>
    </div>
  )
}