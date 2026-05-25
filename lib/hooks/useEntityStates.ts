// lib/hooks/useEntityStates.ts
// FIX BUG-013: Supabase Client Recreated on Every Render
//   Moved createClient() to module level so one client instance is shared
//   for the lifetime of the page rather than a new one on every render.
//
// CRUD for the entity_states table.
// States are branch-scoped — Canon and Alt timelines are independent.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EntityState } from '@/lib/supabase/types'

// FIX BUG-013: module-level singleton
const supabase = createClient()

export function useEntityStates() {
  // ── Fetch ALL states for an entity (entity page god view) ─
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

      return (data as EntityState[]).sort((a, b) => {
        const aOrder = a.chapter?.order_index ?? 0
        const bOrder = b.chapter?.order_index ?? 0
        return aOrder - bOrder
      })
    },
    []
  )

  // ── Fetch ACTIVE states (chapter-aware, for Phase C + D) ──
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
      entityId:  string
      branchId:  string
      chapterId: string
      labelId:   string
      note?:     string
    }): Promise<EntityState | null> => {
      const { data, error } = await supabase
        .from('entity_states')
        .insert({
          entity_id:  entityId,
          branch_id:  branchId,
          chapter_id: chapterId,
          label_id:   labelId,
          note:       note?.trim() || null,
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