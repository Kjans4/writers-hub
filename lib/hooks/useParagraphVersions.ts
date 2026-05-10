// lib/hooks/useParagraphVersions.ts
// Manages paragraph_versions table:
//   - syncParagraphs: called on autosave, diffs current paragraphs vs DB, writes new versions
//   - getVersionsForParagraph: fetches full history for one paragraph_key
//   - restoreVersion: sets a version as current in the editor
// paragraph_key (stable UUID from ParagraphKeyExtension) is always the identifier — never index.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ParagraphVersion } from '@/lib/supabase/types'

export interface ParagraphData {
  key: string     // stable UUID from ParagraphKeyExtension
  content: string // plain text content of the paragraph
}

export function useParagraphVersions() {
  const supabase = createClient()

  // ── Sync paragraphs after autosave ───────────────────────
  // Compares current paragraph contents against the latest saved version.
  // Inserts a new version row for any paragraph that has changed.
  // Marks old versions as is_current = false.
  const syncParagraphs = useCallback(
    async (documentId: string, paragraphs: ParagraphData[]) => {
      if (!documentId || paragraphs.length === 0) return

      // 1. Get all current versions for this document
      const { data: currentVersions } = await supabase
        .from('paragraph_versions')
        .select('paragraph_key, content, id')
        .eq('document_id', documentId)
        .eq('is_current', true)

      const currentMap = new Map<string, { id: string; content: string }>(
        (currentVersions ?? []).map((v) => [
          v.paragraph_key,
          { id: v.id, content: v.content },
        ])
      )

      // 2. Find paragraphs that are new or changed
      const toInsert: { paragraph_key: string; content: string }[] = []
      const toMarkOld: string[] = []

      for (const para of paragraphs) {
        if (!para.key || !para.content.trim()) continue

        const existing = currentMap.get(para.key)

        if (!existing) {
          // New paragraph — insert first version
          toInsert.push({ paragraph_key: para.key, content: para.content })
        } else if (existing.content !== para.content) {
          // Changed paragraph — mark old as not current, insert new
          toMarkOld.push(existing.id)
          toInsert.push({ paragraph_key: para.key, content: para.content })
        }
      }

      // 3. Mark old versions as not current
      if (toMarkOld.length > 0) {
        await supabase
          .from('paragraph_versions')
          .update({ is_current: false })
          .in('id', toMarkOld)
      }

      // 4. Insert new versions
      if (toInsert.length > 0) {
        await supabase.from('paragraph_versions').insert(
          toInsert.map((p) => ({
            document_id: documentId,
            paragraph_key: p.paragraph_key,
            content: p.content,
            is_current: true,
          }))
        )
      }
    },
    []
  )

  // ── Get all versions for a single paragraph ───────────────
  const getVersionsForParagraph = useCallback(
    async (
      documentId: string,
      paragraphKey: string
    ): Promise<ParagraphVersion[]> => {
      const { data } = await supabase
        .from('paragraph_versions')
        .select('*')
        .eq('document_id', documentId)
        .eq('paragraph_key', paragraphKey)
        .order('created_at', { ascending: false })

      return (data as ParagraphVersion[]) ?? []
    },
    []
  )

  // ── Save a new version manually (from rewrite surface) ────
  const saveVersion = useCallback(
    async (
      documentId: string,
      paragraphKey: string,
      content: string
    ): Promise<void> => {
      // Mark existing current version as old
      await supabase
        .from('paragraph_versions')
        .update({ is_current: false })
        .eq('document_id', documentId)
        .eq('paragraph_key', paragraphKey)
        .eq('is_current', true)

      // Insert new current version
      await supabase.from('paragraph_versions').insert({
        document_id: documentId,
        paragraph_key: paragraphKey,
        content,
        is_current: true,
      })
    },
    []
  )

  return { syncParagraphs, getVersionsForParagraph, saveVersion }
}