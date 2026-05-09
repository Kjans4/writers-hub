// components/editor/Editor.tsx
// Core TipTap editor component.
// Extensions: StarterKit, Typography, Placeholder, Link, Heading.
// Wires up: autosave, floating toolbar, focus mode, keyboard shortcuts.
// ParagraphKeyExtension and WikilinkExtension are added in Phase 3 and Phase 5.

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'

import { useAutosave } from '@/lib/hooks/useAutosave'
import EditorToolbar from './EditorToolbar'
import EditorHeader from './EditorHeader'

interface EditorProps {
  documentId: string
  initialTitle: string
  initialContent: string
  onSaveContent: (content: string) => Promise<void>
  onSaveTitle: (title: string) => Promise<void>
}

export default function Editor({
  documentId,
  initialTitle,
  initialContent,
  onSaveContent,
  onSaveTitle,
}: EditorProps) {
  const [content, setContent] = useState(initialContent)
  const [focusMode, setFocusMode] = useState(false)

  // ── TipTap editor instance ────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // We use the Heading extension separately for level control
        heading: false,
        // Keep bold, italic, blockquote, bulletList, orderedList, code, codeBlock
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Typography,
      Placeholder.configure({
        placeholder: 'Begin your story…',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-600 underline underline-offset-2 cursor-pointer',
        },
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'editor-content outline-none min-h-[60vh] pb-32',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    // Keyboard shortcuts
    onCreate: ({ editor }) => {
      // ⌘S / Ctrl+S — manual save trigger (autosave handles the rest)
      editor.view.dom.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault()
          // Autosave will fire; this just prevents browser save dialog
        }
      })
    },
  })

  // Reload content when documentId changes (chapter switch)
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || '')
      setContent(initialContent)
    }
  }, [documentId, initialContent])

  // ── Autosave ──────────────────────────────────────────────
  useAutosave({
    content,
    onSave: onSaveContent,
    delay: 1500,
    enabled: !!editor,
  })

  // ── Focus mode class on editor wrapper ────────────────────
  useEffect(() => {
    const wrapper = document.getElementById('editor-wrapper')
    if (!wrapper) return
    if (focusMode) {
      wrapper.classList.add('focus-mode')
    } else {
      wrapper.classList.remove('focus-mode')
    }
  }, [focusMode])

  return (
    <div
      id="editor-wrapper"
      className="relative min-h-screen px-6 py-12"
    >
      {/* Floating toolbar — appears on selection */}
      <EditorToolbar editor={editor} />

      {/* Chapter title */}
      <EditorHeader
        title={initialTitle}
        onTitleChange={onSaveTitle}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((f) => !f)}
      />

      {/* TipTap editor */}
      <EditorContent editor={editor} />
    </div>
  )
}