// components/editor/Editor.tsx
'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'

import { useAutosave } from '@/lib/hooks/useAutosave'
import { useLinks } from '@/lib/hooks/useLinks'

import { WikilinkExtension } from './extensions/WikilinkExtension'
import { HoverCardExtension } from './extensions/HoverCardExtension'
import EditorToolbar from './EditorToolbar'
import EditorHeader from './EditorHeader'
import WikilinkDropdown from './WikilinkDropdown'
import HoverCard from './HoverCard'

interface EditorProps {
  documentId: string
  projectId: string
  branchId: string
  initialTitle: string
  initialContent: string
  onSaveContent: (content: string) => Promise<void>
  onSaveTitle: (title: string) => Promise<void>
}

export default function Editor({
  documentId,
  projectId,
  branchId,
  initialTitle,
  initialContent,
  onSaveContent,
  onSaveTitle,
}: EditorProps) {
  const [content, setContent] = useState(initialContent)
  const [focusMode, setFocusMode] = useState(false)
  const { syncLinks } = useLinks()

  // ── TipTap editor instance ────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Typography,
      Placeholder.configure({ placeholder: 'Begin your story…' }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-600 underline underline-offset-2 cursor-pointer',
        },
      }),
      WikilinkExtension,
      HoverCardExtension,
    ],
    content: initialContent || '',
    // FIX: Tells Tiptap to wait for the client to render to avoid hydration errors
    immediatelyRender: false, 
    editorProps: {
      attributes: {
        class: 'editor-content outline-none min-h-[60vh] pb-32',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  // ── Sync wikilinks → links table ──────────────────────────
  useEffect(() => {
    function handleWikilinkUpdate(e: Event) {
      const { titles } = (e as CustomEvent).detail as { titles: string[] }
      syncLinks({
        projectId,
        branchId,
        sourceDocId: documentId,
        targetTitles: titles,
      })
    }

    document.addEventListener('wikilink:update', handleWikilinkUpdate)
    return () =>
      document.removeEventListener('wikilink:update', handleWikilinkUpdate)
  }, [projectId, branchId, documentId, syncLinks])

  // ── Reload content when chapter switches ──────────────────
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || '')
      setContent(initialContent)
    }
  }, [documentId, initialContent, editor]) // Added editor to deps

  // ── Autosave ──────────────────────────────────────────────
  useAutosave({
    content,
    onSave: onSaveContent,
    delay: 1500,
    enabled: !!editor,
  })

  // ── Focus mode ────────────────────────────────────────────
  useEffect(() => {
    const wrapper = document.getElementById('editor-wrapper')
    if (!wrapper) return
    wrapper.classList.toggle('focus-mode', focusMode)
  }, [focusMode])

  // Safety Check: If the editor isn't ready, don't render the toolbar/content yet
  if (!editor) {
    return <div className="min-h-screen bg-[#faf9f7]" /> 
  }

  return (
    <div id="editor-wrapper" className="relative min-h-screen px-6 py-12">
      <EditorToolbar editor={editor} />

      <WikilinkDropdown
        editor={editor}
        projectId={projectId}
        branchId={branchId}
      />

      <HoverCard projectId={projectId} branchId={branchId} />

      <EditorHeader
        title={initialTitle}
        onTitleChange={onSaveTitle}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((f) => !f)}
      />

      <EditorContent editor={editor} />
    </div>
  )
}