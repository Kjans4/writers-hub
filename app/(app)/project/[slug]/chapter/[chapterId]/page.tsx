// app/(app)/project/[slug]/chapter/[chapterId]/page.tsx
// Full replacement — adds setActiveDocumentOrderIndex call.

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
  const slug = params.slug as string

  const {
    setActiveDocument,
    setActiveDocumentOrderIndex,   // NEW
    activeBranchId,
  } = useEditorStore()

  const { document, loading, updateDocument } = useDocument(chapterId)

  useEffect(() => {
    setActiveDocument(chapterId)
    return () => {
      setActiveDocument(null)
      setActiveDocumentOrderIndex(null)   // NEW — clear on unmount
    }
  }, [chapterId])

  // NEW — write order_index into store once the document has loaded.
  // This is what Phase C and D will read to filter entity states.
  useEffect(() => {
    if (document?.order_index !== undefined) {
      setActiveDocumentOrderIndex(document.order_index)
    }
  }, [document?.order_index])

  async function handleSaveContent(content: string) {
    await updateDocument({ content })
  }

  async function handleSaveTitle(title: string) {
    await updateDocument({ title })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={20} className="text-stone-300 animate-spin" />
      </div>
    )
  }

  if (!document || !activeBranchId) {
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
      key={chapterId}
      documentId={chapterId}
      projectId={slug}
      branchId={activeBranchId}
      initialTitle={document.title}
      initialContent={document.content ?? ''}
      onSaveContent={handleSaveContent}
      onSaveTitle={handleSaveTitle}
    />
  )
}