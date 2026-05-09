// app/(app)/project/[projectId]/chapter/[chapterId]/page.tsx
// Updated for Phase 3: passes projectId and branchId to Editor
// so WikilinkDropdown and HoverCard can query the right branch.
// Replace your existing chapter page with this file.

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

  const { setActiveDocument, activeBranchId } = useEditorStore()
  const { document, loading, updateDocument } = useDocument(chapterId)

  useEffect(() => {
    setActiveDocument(chapterId)
    return () => setActiveDocument(null)
  }, [chapterId])

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
      projectId={projectId}
      branchId={activeBranchId}
      initialTitle={document.title}
      initialContent={document.content ?? ''}
      onSaveContent={handleSaveContent}
      onSaveTitle={handleSaveTitle}
    />
  )
}