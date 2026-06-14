// app/api/bookmarks/route.ts
// GET — all bookmarks for the current user, with resolved metadata.
// Returns story cover, title, slug, chapter title, chapter position.
// Chapter position is resolved server-side from order_index rank.
//
// Fix B: the join on published_stories may return null for bookmarks
//        whose project has not yet been published. Those rows are
//        filtered out of the response (no story metadata = can't render
//        a useful BookmarkCard). The bookmark row is NOT deleted —
//        if the story is published later the bookmark will surface.
//
// Response shape per item:
//   {
//     id:               string
//     document_id:      string
//     story_id:         string        ← added for CoverPlaceholder (fix D)
//     chapter_number:   number        ← 1-based, from COUNT query
//     chapter_title:    string
//     story_slug:       string
//     story_title:      string
//     story_cover_url:  string | null
//     created_at:       string
//   }

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Fetch bookmarks with joins ────────────────────────────
  // Join to documents (chapter title, order_index, project_id, branch_id)
  // and to published_stories (id, slug, title, cover_url).
  // published_stories join may return null — see Fix B above.
  const { data: rows, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      document_id,
      created_at,
      documents (
        title,
        order_index,
        project_id,
        branch_id
      ),
      published_stories (
        id,
        slug,
        title,
        cover_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ bookmarks: [] })
  }

  // ── Resolve chapter position for each bookmark ────────────
  // Position = COUNT of published chapters with order_index <=
  // this chapter's order_index within the same project + branch.
  // The .lte filter includes the bookmarked chapter itself, so
  // COUNT directly gives the correct 1-based position (no +1 needed).
  // Rows where story or doc is null (unpublished project) are
  // filtered out — they can't render a usable BookmarkCard.
  const resolved = await Promise.all(
    rows.map(async (row) => {
      // Supabase returns joined single-row relations as objects (not arrays)
      // when the FK is many-to-one, but may return arrays in some SDK versions.
      // Normalise defensively.
      const doc   = Array.isArray(row.documents)
        ? row.documents[0]
        : row.documents
      const story = Array.isArray(row.published_stories)
        ? row.published_stories[0]
        : row.published_stories

      // Fix B: skip rows with no story (project not yet published)
      if (!doc || !story) return null

      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', (doc as any).project_id)
        .eq('branch_id',  (doc as any).branch_id)
        .eq('type',       'chapter')
        .eq('is_published', true)
        .lte('order_index', (doc as any).order_index ?? 0)

      return {
        id:              row.id,
        document_id:     row.document_id,
        // Fix D: pass story_id (not document_id) so BookmarkCard's
        // CoverPlaceholder derives the same color as the home feed.
        story_id:        (story as any).id,
        chapter_number:  count ?? 1,
        chapter_title:   (doc as any).title ?? 'Untitled',
        story_slug:      (story as any).slug,
        story_title:     (story as any).title,
        story_cover_url: (story as any).cover_url ?? null,
        created_at:      row.created_at,
      }
    })
  )

  const bookmarks = resolved.filter(Boolean)

  return NextResponse.json({ bookmarks })
}