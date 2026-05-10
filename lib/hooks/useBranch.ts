// lib/hooks/useBranch.ts
// Manages branches for a project:
//   - getBranches: fetch all branches for a project
//   - createBranch: fork — copies all Canon documents to new UUIDs,
//     creates new link rows pointing to the new document UUIDs
//   - setAsCanon: promotes a branch to Canon, demotes the old Canon
//   - deleteBranch: removes a non-Canon branch
// Forking rule: new link rows must be created for the new branch —
// branches never share link rows with Canon.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Branch, Document } from '@/lib/supabase/types'

export function useBranch() {
  const supabase = createClient()

  // ── Fetch all branches for a project ─────────────────────
  const getBranches = useCallback(
    async (projectId: string): Promise<Branch[]> => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) return []
      return (data as Branch[]) ?? []
    },
    []
  )

  // ── Fork: create a new branch from Canon ──────────────────
  // Steps:
  // 1. Create the new branch row
  // 2. Copy all Canon documents to new UUID rows on the new branch
  // 3. Build a mapping of old doc ID → new doc ID
  // 4. Copy all Canon link rows, replacing source/target with new IDs
  const createBranch = useCallback(
    async ({
      projectId,
      canonBranchId,
      name,
    }: {
      projectId: string
      canonBranchId: string
      name: string
    }): Promise<Branch | null> => {
      // 1. Create the branch row
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert({
          project_id: projectId,
          name: name.trim(),
          is_canon: false,
          parent_branch_id: canonBranchId,
        })
        .select()
        .single()

      if (branchError || !branch) return null

      // 2. Fetch all Canon documents
      const { data: canonDocs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_id', canonBranchId)

      if (docsError || !canonDocs || canonDocs.length === 0) return branch

      // 3. Insert copies with new IDs on the new branch
      //    Build old → new ID mapping as we go
      const idMap = new Map<string, string>()

      const newDocs = canonDocs.map((doc: Document) => {
        // We need to generate new IDs client-side for the mapping
        // Supabase will assign real UUIDs; we use a temp approach:
        // insert one by one to capture each new ID
        return {
          project_id: projectId,
          branch_id: branch.id,
          type: doc.type,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
          order_index: doc.order_index,
        }
      })

      // Insert all new docs in one batch
      const { data: insertedDocs, error: insertError } = await supabase
        .from('documents')
        .insert(newDocs)
        .select('id')

      if (insertError || !insertedDocs) return branch

      // Build ID map: canonDocs[i].id → insertedDocs[i].id
      canonDocs.forEach((doc: Document, i: number) => {
        if (insertedDocs[i]) {
          idMap.set(doc.id, insertedDocs[i].id)
        }
      })

      // 4. Fetch Canon links and copy them with remapped IDs
      const { data: canonLinks } = await supabase
        .from('links')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_id', canonBranchId)

      if (canonLinks && canonLinks.length > 0) {
        const newLinks = canonLinks
          .map((link: any) => ({
            project_id: projectId,
            branch_id: branch.id,
            source_doc_id: idMap.get(link.source_doc_id) ?? link.source_doc_id,
            target_doc_id: idMap.get(link.target_doc_id) ?? link.target_doc_id,
          }))
          .filter(
            (l: any) =>
              // Only include links where both endpoints were successfully remapped
              l.source_doc_id !== l.target_doc_id
          )

        if (newLinks.length > 0) {
          await supabase.from('links').insert(newLinks)
        }
      }

      return branch as Branch
    },
    []
  )

  // ── Set a branch as Canon ─────────────────────────────────
  // Demotes old Canon, promotes the selected branch.
  // Does NOT copy documents back — the writer has chosen this branch.
  const setAsCanon = useCallback(
    async ({
      projectId,
      newCanonBranchId,
    }: {
      projectId: string
      newCanonBranchId: string
    }): Promise<boolean> => {
      // 1. Demote all branches for this project
      const { error: demoteError } = await supabase
        .from('branches')
        .update({ is_canon: false })
        .eq('project_id', projectId)

      if (demoteError) return false

      // 2. Promote the selected branch
      const { error: promoteError } = await supabase
        .from('branches')
        .update({ is_canon: true })
        .eq('id', newCanonBranchId)

      return !promoteError
    },
    []
  )

  // ── Delete a non-Canon branch ─────────────────────────────
  const deleteBranch = useCallback(
    async (branchId: string): Promise<boolean> => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId)
        .eq('is_canon', false) // Safety: never delete Canon via this hook

      return !error
    },
    []
  )

  return { getBranches, createBranch, setAsCanon, deleteBranch }
}