// lib/hooks/useEntitySearch.ts
// Fetches entities by title prefix for the inline autocomplete.
// Only queries non-chapter documents on the active branch.
// Returns up to 8 matches sorted alphabetically.
// Called from InlineAutocompleteExtension on qualifying keystrokes.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Document } from '@/lib/supabase/types'

export function useEntitySearch() {
  const supabase = createClient()

  const searchEntities = useCallback(
    async ({
      projectId,
      branchId,
      query,
    }: {
      projectId: string
      branchId: string
      query: string
    }): Promise<Document[]> => {
      // Guard: enforce 3-char minimum at the hook level too
      if (!query || query.length < 3) return []

      const { data, error } = await supabase
        .from('documents')
        .select('id, title, type, project_id, branch_id')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)
        .neq('type', 'chapter')               // entities only, not chapters
        .ilike('title', `${query}%`)           // prefix match, case-insensitive
        .order('title', { ascending: true })
        .limit(8)

      if (error || !data) return []
      return data as Document[]
    },
    []
  )

  return { searchEntities }
}