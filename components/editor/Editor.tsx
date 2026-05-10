// components/editor/Editor.tsx
// Main editor component, mounted at /project/[projectId]/edit.
// Contains the TipTap editor instance and orchestrates all editing features.
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'

import { useAutosave } from '@/lib/hooks/useAutosave'
import { useLinks } from '@/lib/hooks/useLinks'
import { useParagraphVersions, ParagraphData } from '@/lib/hooks/useParagraphVersions'
import { useSnapshots } from '@/lib/hooks/useSnapshots'

import { WikilinkExtension } from './extensions/WikilinkExtension'
import { HoverCardExtension } from './extensions/HoverCardExtension'
import { ParagraphKeyExtension } from './extensions/ParagraphKeyExtension'
// ── ADDED IMPORT ──────────────────────────────────────────
import { InlineAutocompleteExtension } from './extensions/InlineAutocompleteExtension'
import InlineAutocomplete from './InlineAutocomplete'

import EditorToolbar from './EditorToolbar'
import EditorHeader from './EditorHeader'
import WikilinkDropdown from './WikilinkDropdown'
import HoverCard from './HoverCard'
import RewriteSurface from './RewriteSurface'
import CompareView from './CompareView'
import HistoryDrawer from './HistoryDrawer'
import CheckpointModal from '@/components/timeline/CheckpointModal'
import TimelineStrip from '@/components/timeline/TimelineStrip'

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

  // ── Paragraph versioning state ────────────────────────────
  const [showRewrite, setShowRewrite] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeParagraphKey, setActiveParagraphKey] = useState<string | null>(null)
  const [activeParagraphContent, setActiveParagraphContent] = useState('')
  const [compareVersions, setCompareVersions] = useState<{ a: string; b: string } | null>(null)
  const [versionsExist, setVersionsExist] = useState<Set<string>>(new Set())

  // ── Checkpoint state ──────────────────────────────────────
  const [showCheckpointModal, setShowCheckpointModal] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  const { syncLinks } = useLinks()
  const { syncParagraphs, getVersionsForParagraph, saveVersion } = useParagraphVersions()
  const { createSnapshot } = useSnapshots()

  // ── Extract paragraphs ────────────────────────────────────
  function extractParagraphs(editor: ReturnType<typeof useEditor>): ParagraphData[] {
    if (!editor) return []
    const paragraphs: ParagraphData[] = []
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'paragraph' && node.attrs.paragraph_key) {
        paragraphs.push({
          key: node.attrs.paragraph_key,
          content: node.textContent,
        })
      }
    })
    return paragraphs
  }

  // ── Get active paragraph from cursor ─────────────────────
  function getActiveParagraph(editor: ReturnType<typeof useEditor>): {
    key: string | null
    content: string
  } {
    if (!editor) return { key: null, content: '' }
    const { from } = editor.state.selection
    let result = { key: null as string | null, content: '' }
    editor.state.doc.nodesBetween(from, from, (node) => {
      if (node.type.name === 'paragraph') {
        result = {
          key: node.attrs.paragraph_key ?? null,
          content: node.textContent,
        }
      }
    })
    return result
  }

  // ── TipTap editor instance ────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
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
      ParagraphKeyExtension,
      // ── ADDED EXTENSION ───────────────────────────────────
      InlineAutocompleteExtension.configure({
        projectId,
        branchId,
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
  })

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      // ⌘⇧S — save checkpoint
      if (mod && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        setShowCheckpointModal(true)
      }

      // ⌘. — toggle focus mode
      if (mod && e.key === '.') {
        e.preventDefault()
        setFocusMode((f) => !f)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Rewrite button event ──────────────────────────────────
  useEffect(() => {
    function handleRewriteClick() {
      if (!editor) return
      const { key, content } = getActiveParagraph(editor)
      setActiveParagraphKey(key)
      setActiveParagraphContent(editor.getHTML())

      if (key && versionsExist.has(key)) {
        setShowHistory(true)
      } else {
        setShowRewrite(true)
      }
    }

    document.addEventListener('editor:rewrite', handleRewriteClick)
    return () => document.removeEventListener('editor:rewrite', handleRewriteClick)
  }, [editor, versionsExist])

  // ── Sync wikilinks ────────────────────────────────────────
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
    return () => document.removeEventListener('wikilink:update', handleWikilinkUpdate)
  }, [projectId, branchId, documentId, syncLinks])

  // ── Reload on chapter switch ──────────────────────────────
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || '')
      setContent(initialContent)
    }
  }, [documentId, initialContent])

  // ── Autosave + paragraph sync ─────────────────────────────
  const handleSave = useCallback(
    async (html: string) => {
      await onSaveContent(html)
      if (editor) {
        const paragraphs = extractParagraphs(editor)
        await syncParagraphs(documentId, paragraphs)

        const keysWithHistory = new Set<string>()
        for (const para of paragraphs) {
          const versions = await getVersionsForParagraph(documentId, para.key)
          if (versions.length > 1) keysWithHistory.add(para.key)
        }
        setVersionsExist(keysWithHistory)
      }
    },
    [editor, documentId, onSaveContent, syncParagraphs, getVersionsForParagraph]
  )

  useAutosave({
    content,
    onSave: handleSave,
    delay: 1500,
    enabled: !!editor,
  })

  // ── Focus mode ────────────────────────────────────────────
  useEffect(() => {
    const wrapper = document.getElementById('editor-wrapper')
    if (!wrapper) return
    wrapper.classList.toggle('focus-mode', focusMode)
  }, [focusMode])

  // ── Use a version ─────────────────────────────────────────
  function handleUseVersion(versionContent: string) {
    if (!editor || !activeParagraphKey) return
    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === 'paragraph' &&
        node.attrs.paragraph_key === activeParagraphKey
      ) {
        const tr = editor.state.tr
        tr.replaceWith(
          pos,
          pos + node.nodeSize,
          editor.schema.nodes.paragraph.create(
            node.attrs,
            editor.schema.text(versionContent)
          )
        )
        editor.view.dispatch(tr)
      }
    })
  }

  // ── Save checkpoint ───────────────────────────────────────
  async function handleSaveCheckpoint(message: string) {
    if (!editor) return
    await createSnapshot({
      documentId,
      branchId,
      content: editor.getHTML(),
      message,
    })
  }

  // ── Restore from checkpoint ───────────────────────────────
  function handleRestoreCheckpoint(restoredContent: string) {
    if (!editor) return
    editor.commands.setContent(restoredContent)
    setContent(restoredContent)
    setShowTimeline(false)
  }

  return (
    <div id="editor-wrapper" className="relative min-h-screen px-6 py-12">

      {/* Floating toolbar */}
      <EditorToolbar editor={editor} />

      {/* Wikilink dropdown */}
      <WikilinkDropdown editor={editor} projectId={projectId} branchId={branchId} />

      {/* Hover card */}
      <HoverCard projectId={projectId} branchId={branchId} />

      {/* ── ADDED COMPONENT ─────────────────────────────────── */}
      <InlineAutocomplete editor={editor} />

      {/* Chapter title + timeline toggle + checkpoint button */}
      <EditorHeader
        title={initialTitle}
        onTitleChange={onSaveTitle}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((f) => !f)}
        onOpenCheckpoint={() => setShowCheckpointModal(true)}
        onToggleTimeline={() => setShowTimeline((t) => !t)}
        timelineOpen={showTimeline}
      />

      {/* Timeline strip — shown below title when toggled */}
      {showTimeline && (
        <TimelineStrip
          documentId={documentId}
          branchId={branchId}
          currentContent={content}
          onRestore={handleRestoreCheckpoint}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* ── Modals ─────────────────────────────────────────── */}

      {/* Checkpoint modal */}
      {showCheckpointModal && (
        <CheckpointModal
          onSave={handleSaveCheckpoint}
          onClose={() => setShowCheckpointModal(false)}
        />
      )}

      {/* Rewrite surface */}
      {showRewrite && editor && (
        <RewriteSurface
          editor={editor}
          documentId={documentId}
          paragraphKey={activeParagraphKey}
          originalContent={activeParagraphContent}
          onClose={() => setShowRewrite(false)}
          onUse={handleUseVersion}
          onCompare={(a, b) => {
            setCompareVersions({ a, b })
            setShowRewrite(false)
            setShowCompare(true)
          }}
        />
      )}

      {/* Compare view */}
      {showCompare && compareVersions && (
        <CompareView
          versionA={compareVersions.a}
          versionB={compareVersions.b}
          labelA="Original"
          labelB="Rewrite"
          onUse={(content) => {
            handleUseVersion(content)
            setShowCompare(false)
          }}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* History drawer */}
      {showHistory && activeParagraphKey && (
        <HistoryDrawer
          documentId={documentId}
          paragraphKey={activeParagraphKey}
          onRestore={(content) => {
            handleUseVersion(content)
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}