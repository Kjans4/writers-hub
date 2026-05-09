// app/(app)/project/[projectId]/chapter/[chapterId]/page.tsx
// Chapter editor page. Loads the document, mounts the Editor component,
// and wires up save handlers for both content and title.
// Sets activeDocumentId in Zustand on mount.

'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import { useDocument } from '@/lib/hooks/useDocument'
import Editor from '@/components/editor/Editor'
import { Loader2 } from 'lucide-react'

export default function ChapterPage() {
  const params = useParams()
  const chapterId = params.chapterId as string
  const projectId = params.projectId as string

  const { setActiveDocument } = useEditorStore()
  const { document, loading, updateDocument } = useDocument(chapterId)

  // Register active document in global store
  useEffect(() => {
    setActiveDocument(chapterId)
    return () => setActiveDocument(null)
  }, [chapterId])

  // ── Save handlers ─────────────────────────────────────────

  async function handleSaveContent(content: string) {
    await updateDocument({ content })
  }

  async function handleSaveTitle(title: string) {
    await updateDocument({ title })
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={20} className="text-stone-300 animate-spin" />
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────
  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 font-['Inter'] text-sm">
          Chapter not found.
        </p>
      </div>
    )
  }

  return (
    <Editor
      key={chapterId} // Force remount on chapter switch
      documentId={chapterId}
      initialTitle={document.title}
      initialContent={document.content ?? ''}
      onSaveContent={handleSaveContent}
      onSaveTitle={handleSaveTitle}
    />
  )
}