// lib/hooks/useDocument.ts
// Fetches a single document by ID from Supabase.
// Returns the document, a loading flag, and an update function.
// Used by the chapter editor page and entity pages.

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Document } from '@/lib/supabase/types'

interface UseDocumentReturn {
  document: Document | null
  loading: boolean
  updateDocument: (fields: Partial<Pick<Document, 'title' | 'content'>>) => Promise<void>
}

export function useDocument(documentId: string | null): UseDocumentReturn {
  const supabase = createClient()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!documentId) {
      setDocument(null)
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (!error && data) setDocument(data as Document)
      setLoading(false)
    }

    load()
  }, [documentId])

  const updateDocument = useCallback(
    async (fields: Partial<Pick<Document, 'title' | 'content'>>) => {
      if (!documentId) return

      const { data, error } = await supabase
        .from('documents')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .select()
        .single()

      if (!error && data) setDocument(data as Document)
    },
    [documentId]
  )

  return { document, loading, updateDocument }
}