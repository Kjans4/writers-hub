// lib/hooks/useSnapshots.ts
// Manages the snapshots table for chapter checkpoints.
//   - createSnapshot: saves current content + message as a named snapshot
//   - getSnapshots: fetches all snapshots for a document, newest first
//   - restoreSnapshot: updates document content to snapshot content,
//     then auto-creates a new snapshot marking the restore point
// Checkpoints store the full chapter content — not a diff.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Snapshot } from '@/lib/supabase/types'

export function useSnapshots() {
  const supabase = createClient()

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
          branch_id: branchId,
          content,
          message: message.trim() || null,
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
  // 1. Updates documents.content to the snapshot content
  // 2. Auto-creates a new snapshot marking the restore event
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
      // 1. Update the document content
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          content: snapshot.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (updateError) return false

      // 2. Auto-create a restore-point snapshot
      await supabase.from('snapshots').insert({
        document_id: documentId,
        branch_id: branchId,
        content: snapshot.content,
        message: `Restored from: "${snapshot.message ?? formatDate(snapshot.created_at)}"`,
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
    day: 'numeric',
    year: 'numeric',
  })
}