// lib/hooks/useEntityStates.ts
// CRUD for the entity_states table.
// States are branch-scoped — Canon and Alt timelines are independent.
//
// Exports:
//   getStatesForEntity(entityId, branchId)
//     → EntityState[] with joined mark_labels and chapter data
//     → sorted by chapter order_index ascending (timeline order)
//
//   getActiveStatesForEntity(entityId, branchId, currentOrderIndex)
//     → EntityState[] filtered to states whose chapter.order_index
//       is <= currentOrderIndex
//     → used in Phase C (hover card) and Phase D (editor dots)
//     → included now so the hook API is complete
//
//   addState(entityId, branchId, chapterId, labelId, note)
//     → EntityState | null
//
//   deleteState(id)
//     → boolean

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EntityState } from '@/lib/supabase/types'

export function useEntityStates() {
  const supabase = createClient()

  // ── Fetch ALL states for an entity (entity page god view) ─
  // Joins mark_labels for color/name and chapter document for
  // title and order_index. Sorted by chapter order so the
  // timeline reads chronologically top to bottom.
  const getStatesForEntity = useCallback(
    async (
      entityId: string,
      branchId: string
    ): Promise<EntityState[]> => {
      const { data, error } = await supabase
        .from('entity_states')
        .select(`
          *,
          mark_labels ( id, name, color ),
          chapter:documents!entity_states_chapter_id_fkey (
            id, title, order_index
          )
        `)
        .eq('entity_id', entityId)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: true })

      if (error || !data) return []

      // Sort by the joined chapter's order_index so timeline is
      // always in story order regardless of insertion order
      return (data as EntityState[]).sort((a, b) => {
        const aOrder = a.chapter?.order_index ?? 0
        const bOrder = b.chapter?.order_index ?? 0
        return aOrder - bOrder
      })
    },
    []
  )

  // ── Fetch ACTIVE states (chapter-aware, for Phase C + D) ──
  // Returns only states whose chapter.order_index <= the
  // currently open chapter's order_index.
  // Called from HoverCard (Phase C) and EntityStateDots (Phase D).
  // Included in this hook now so nothing needs to change later.
  const getActiveStatesForEntity = useCallback(
    async (
      entityId: string,
      branchId: string,
      currentOrderIndex: number
    ): Promise<EntityState[]> => {
      const { data, error } = await supabase
        .from('entity_states')
        .select(`
          *,
          mark_labels ( id, name, color ),
          chapter:documents!entity_states_chapter_id_fkey (
            id, title, order_index
          )
        `)
        .eq('entity_id', entityId)
        .eq('branch_id', branchId)

      if (error || !data) return []

      // Filter client-side: only states that have "happened" by
      // the current chapter position
      return (data as EntityState[])
        .filter((s) => (s.chapter?.order_index ?? 0) <= currentOrderIndex)
        .sort((a, b) => {
          const aOrder = a.chapter?.order_index ?? 0
          const bOrder = b.chapter?.order_index ?? 0
          return aOrder - bOrder
        })
    },
    []
  )

  // ── Add a new state to an entity ─────────────────────────
  const addState = useCallback(
    async ({
      entityId,
      branchId,
      chapterId,
      labelId,
      note,
    }: {
      entityId: string
      branchId: string
      chapterId: string
      labelId: string
      note?: string
    }): Promise<EntityState | null> => {
      const { data, error } = await supabase
        .from('entity_states')
        .insert({
          entity_id: entityId,
          branch_id: branchId,
          chapter_id: chapterId,
          label_id: labelId,
          note: note?.trim() || null,
        })
        .select(`
          *,
          mark_labels ( id, name, color ),
          chapter:documents!entity_states_chapter_id_fkey (
            id, title, order_index
          )
        `)
        .single()

      if (error || !data) return null
      return data as EntityState
    },
    []
  )

  // ── Delete a state ────────────────────────────────────────
  const deleteState = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('entity_states')
        .delete()
        .eq('id', id)

      return !error
    },
    []
  )

  return {
    getStatesForEntity,
    getActiveStatesForEntity,
    addState,
    deleteState,
  }
}