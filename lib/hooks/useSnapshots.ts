// lib/hooks/useSnapshots.ts
// FIX BUG-013: Supabase Client Recreated on Every Render
//   Moved createClient() to module level so one client instance is shared
//   for the lifetime of the page rather than a new one on every render.
//
// Manages the snapshots table for chapter checkpoints.
//   - createSnapshot: saves current content + message as a named snapshot
//   - getSnapshots: fetches all snapshots for a document, newest first
//   - restoreSnapshot: updates document content to snapshot content,
//     then auto-creates a new snapshot marking the restore point
// Checkpoints store the full chapter content — not a diff.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Snapshot } from '@/lib/supabase/types'

// FIX BUG-013: module-level singleton
const supabase = createClient()

export function useSnapshots() {
  // ── Create a named checkpoint ─────────────────────────────
  const createSnapshot = useCallback(
    async ({
      documentId,
      branchId,
      content,
      message,
    }: {
      documentId: string
      branchId: string
      content: string
      message: string
    }): Promise<Snapshot | null> => {
      const { data, error } = await supabase
        .from('snapshots')
        .insert({
          document_id: documentId,
          branch_id:   branchId,
          content,
          message:     message.trim() || null,
        })
        .select()
        .single()

      if (error) return null
      return data as Snapshot
    },
    []
  )

  // ── Fetch all snapshots for a document ────────────────────
  const getSnapshots = useCallback(
    async (documentId: string): Promise<Snapshot[]> => {
      const { data, error } = await supabase
        .from('snapshots')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) return []
      return (data as Snapshot[]) ?? []
    },
    []
  )

  // ── Restore a snapshot ────────────────────────────────────
  const restoreSnapshot = useCallback(
    async ({
      documentId,
      branchId,
      snapshot,
    }: {
      documentId: string
      branchId: string
      snapshot: Snapshot
    }): Promise<boolean> => {
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          content:    snapshot.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (updateError) return false

      await supabase.from('snapshots').insert({
        document_id: documentId,
        branch_id:   branchId,
        content:     snapshot.content,
        message:     `Restored from: "${snapshot.message ?? formatDate(snapshot.created_at)}"`,
      })

      return true
    },
    []
  )

  return { createSnapshot, getSnapshots, restoreSnapshot }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}