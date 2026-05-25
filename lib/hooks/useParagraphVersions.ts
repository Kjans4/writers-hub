// lib/hooks/useParagraphVersions.ts
// FIX BUG-013: Supabase Client Recreated on Every Render
//   Moved createClient() to module level so one client instance is shared
//   for the lifetime of the page rather than a new one on every render.
//
// Manages paragraph_versions table:
//   - syncParagraphs: called on autosave, diffs current paragraphs vs DB, writes new versions
//   - getVersionsForParagraph: fetches full history for one paragraph_key
//   - saveVersion: saves a new version manually (from rewrite surface)
// paragraph_key (stable UUID from ParagraphKeyExtension) is always the identifier — never index.

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ParagraphVersion } from '@/lib/supabase/types'

// FIX BUG-013: module-level singleton
const supabase = createClient()

export interface ParagraphData {
  key: string     // stable UUID from ParagraphKeyExtension
  content: string // plain text content of the paragraph
}

export function useParagraphVersions() {
  // ── Sync paragraphs after autosave ───────────────────────
  const syncParagraphs = useCallback(
    async (documentId: string, paragraphs: ParagraphData[]) => {
      if (!documentId || paragraphs.length === 0) return

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

      const toInsert: { paragraph_key: string; content: string }[] = []
      const toMarkOld: string[] = []

      for (const para of paragraphs) {
        if (!para.key || !para.content.trim()) continue

        const existing = currentMap.get(para.key)

        if (!existing) {
          toInsert.push({ paragraph_key: para.key, content: para.content })
        } else if (existing.content !== para.content) {
          toMarkOld.push(existing.id)
          toInsert.push({ paragraph_key: para.key, content: para.content })
        }
      }

      if (toMarkOld.length > 0) {
        await supabase
          .from('paragraph_versions')
          .update({ is_current: false })
          .in('id', toMarkOld)
      }

      if (toInsert.length > 0) {
        await supabase.from('paragraph_versions').insert(
          toInsert.map((p) => ({
            document_id:   documentId,
            paragraph_key: p.paragraph_key,
            content:       p.content,
            is_current:    true,
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
      await supabase
        .from('paragraph_versions')
        .update({ is_current: false })
        .eq('document_id', documentId)
        .eq('paragraph_key', paragraphKey)
        .eq('is_current', true)

      await supabase.from('paragraph_versions').insert({
        document_id:   documentId,
        paragraph_key: paragraphKey,
        content,
        is_current:    true,
      })
    },
    []
  )

  return { syncParagraphs, getVersionsForParagraph, saveVersion }
}