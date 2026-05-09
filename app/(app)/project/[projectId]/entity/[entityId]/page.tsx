// app/(app)/project/[projectId]/entity/[entityId]/page.tsx
// Entity page route. Renders EntityPage component in the main editor area.
// Sets activeDocumentId in Zustand on mount.

'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import EntityPage from '@/components/entity/EntityPage'

export default function EntityRoute() {
  const params = useParams()
  const entityId = params.entityId as string
  const projectId = params.projectId as string

  const { setActiveDocument } = useEditorStore()

  useEffect(() => {
    setActiveDocument(entityId)
    return () => setActiveDocument(null)
  }, [entityId])

  return <EntityPage entityId={entityId} projectId={projectId} />
}