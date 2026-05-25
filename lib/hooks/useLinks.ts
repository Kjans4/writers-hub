// lib/hooks/useLinks.ts
// FIX BUG-013: Supabase Client Recreated on Every Render
//   `createClient()` was called inside the hook body, meaning a new Supabase
//   browser client was instantiated on every component render. createBrowserClient
//   from @supabase/ssr is designed to be called once and reused — repeated calls
//   waste memory and can interfere with Supabase's internal session/cookie
//   management. Fixed by moving the client to module level so it is created
//   once and shared across all hook calls.
//
// Manages the links table — the single source of truth for
// wikilink connections, hover card data, "Appears In", and the story map.
// Exposes: syncLinks (diff + upsert), getLinksForDocument, getEntityMeta.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link, Document } from '@/lib/supabase/types'

// FIX BUG-013: module-level singleton — one client for the lifetime of the page
const supabase = createClient()

export function useLinks() {
  // ── Sync links from a parsed wikilink list ──────────────────────────
  const syncLinks = useCallback(
    async ({
      projectId,
      branchId,
      sourceDocId,
      targetTitles,
    }: {
      projectId: string
      branchId: string
      sourceDocId: string
      targetTitles: string[]
    }) => {
      if (!projectId || !branchId || !sourceDocId) return

      if (targetTitles.length === 0) {
        await supabase
          .from('links')
          .delete()
          .eq('source_doc_id', sourceDocId)
          .eq('branch_id', branchId)
        return
      }

      const { data: targets } = await supabase
        .from('documents')
        .select('id, title')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)
        .in('title', targetTitles)

      if (!targets) return

      const targetIds = targets.map((t) => t.id)

      const { data: existing } = await supabase
        .from('links')
        .select('id, target_doc_id')
        .eq('source_doc_id', sourceDocId)
        .eq('branch_id', branchId)

      const existingTargetIds = new Set((existing ?? []).map((l) => l.target_doc_id))
      const newTargetIds      = new Set(targetIds)

      const toInsert = targetIds.filter((id) => !existingTargetIds.has(id))
      if (toInsert.length > 0) {
        await supabase.from('links').insert(
          toInsert.map((targetId) => ({
            project_id:    projectId,
            branch_id:     branchId,
            source_doc_id: sourceDocId,
            target_doc_id: targetId,
          }))
        )
      }

      const toDelete = (existing ?? [])
        .filter((l) => !newTargetIds.has(l.target_doc_id))
        .map((l) => l.id)

      if (toDelete.length > 0) {
        await supabase.from('links').delete().in('id', toDelete)
      }
    },
    []
  )

  // ── Get all documents that link TO a given entity ──────────────────
  const getAppearsIn = useCallback(
    async (entityId: string): Promise<Document[]> => {
      const { data } = await supabase
        .from('links')
        .select('source_doc_id, documents!links_source_doc_id_fkey(*)')
        .eq('target_doc_id', entityId)

      if (!data) return []
      return data.map((row: any) => row.documents).filter(Boolean) as Document[]
    },
    []
  )

  // ── Get all entities this document links TO ────────────────────────
  const getConnectedTo = useCallback(
    async (docId: string): Promise<Document[]> => {
      const { data } = await supabase
        .from('links')
        .select('target_doc_id, documents!links_target_doc_id_fkey(*)')
        .eq('source_doc_id', docId)

      if (!data) return []
      return data.map((row: any) => row.documents).filter(Boolean) as Document[]
    },
    []
  )

  // ── Get entity metadata for hover card ────────────────────────────
  const getEntityMeta = useCallback(
    async (
      projectId: string,
      branchId: string,
      title: string
    ): Promise<Document | null> => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)
        .eq('title', title)
        .neq('type', 'chapter')
        .single()

      return data as Document | null
    },
    []
  )

  return { syncLinks, getAppearsIn, getConnectedTo, getEntityMeta }
}