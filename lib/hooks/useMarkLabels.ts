// lib/hooks/useMarkLabels.ts
// FIX BUG-013: Supabase Client Recreated on Every Render
//   Moved createClient() to module level so one client instance is shared
//   for the lifetime of the page rather than a new one on every render.
//
// CRUD for the mark_labels table.
// Labels are project-scoped — shared across all branches.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MarkLabel } from '@/lib/supabase/types'

// FIX BUG-013: module-level singleton
const supabase = createClient()

export function useMarkLabels() {
  // ── Fetch all labels for a project ───────────────────────
  const getLabels = useCallback(
    async (projectId: string): Promise<MarkLabel[]> => {
      const { data, error } = await supabase
        .from('mark_labels')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true })

      if (error || !data) return []
      return data as MarkLabel[]
    },
    []
  )

  // ── Create a new label ────────────────────────────────────
  const createLabel = useCallback(
    async (
      projectId: string,
      name: string,
      color: string
    ): Promise<MarkLabel | null> => {
      const { data, error } = await supabase
        .from('mark_labels')
        .insert({
          project_id: projectId,
          name:       name.trim(),
          color,
        })
        .select()
        .single()

      if (error || !data) return null
      return data as MarkLabel
    },
    []
  )

  // ── Update label name or color ────────────────────────────
  const updateLabel = useCallback(
    async (
      id: string,
      fields: Partial<Pick<MarkLabel, 'name' | 'color'>>
    ): Promise<MarkLabel | null> => {
      const { data, error } = await supabase
        .from('mark_labels')
        .update(fields)
        .eq('id', id)
        .select()
        .single()

      if (error || !data) return null
      return data as MarkLabel
    },
    []
  )

  // ── Delete a label ────────────────────────────────────────
  // Note: deleting a label cascades to all entity_states that
  // reference it (on delete cascade in the migration).
  const deleteLabel = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('mark_labels')
        .delete()
        .eq('id', id)

      return !error
    },
    []
  )

  return { getLabels, createLabel, updateLabel, deleteLabel }
}