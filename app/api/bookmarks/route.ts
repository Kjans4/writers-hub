// app/api/bookmarks/route.ts
// GET — all bookmarks for the current user, with chapter_number computed
// from the document's position in the published chapter ordering.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch bookmarks with document + story data
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        document_id,
        created_at,
        documents (
          id,
          title,
          project_id
        ),
        published_stories (
          id,
          slug,
          title,
          cover_url,
          project_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // 2. Collect unique project_ids so we can fetch chapter orderings in bulk
    const projectIds = [
      ...new Set(
        (data ?? [])
          .map((row: any) => {
            const story = row.published_stories
            return Array.isArray(story) ? story[0]?.project_id : story?.project_id
          })
          .filter(Boolean)
      ),
    ] as string[]

    // 3. For each project, fetch published chapters ordered by order_index
    //    and build a document_id → 1-based position map
    const positionMap = new Map<string, number>()

    if (projectIds.length > 0) {
      const { data: chapterRows } = await supabase
        .from('documents')
        .select('id, project_id, order_index')
        .in('project_id', projectIds)
        .eq('type', 'chapter')
        .eq('is_published', true)
        .order('order_index', { ascending: true })

      // Group by project_id and assign positions
      const byProject = new Map<string, string[]>()
      for (const ch of chapterRows ?? []) {
        const list = byProject.get(ch.project_id) ?? []
        list.push(ch.id)
        byProject.set(ch.project_id, list)
      }

      for (const [, ids] of byProject) {
        ids.forEach((id, idx) => positionMap.set(id, idx + 1))
      }
    }

    // 4. Shape the response
    const bookmarks = (data ?? []).map((row: any) => {
      const doc   = Array.isArray(row.documents)        ? row.documents[0]        : row.documents
      const story = Array.isArray(row.published_stories) ? row.published_stories[0] : row.published_stories

      if (!doc || !story) return null

      return {
        id:              row.id,
        document_id:     row.document_id,
        story_id:        story.id,
        chapter_number:  positionMap.get(row.document_id) ?? 1,
        chapter_title:   doc.title ?? 'Untitled',
        story_slug:      story.slug,
        story_title:     story.title,
        story_cover_url: story.cover_url ?? null,
        created_at:      row.created_at,
      }
    }).filter(Boolean)

    return NextResponse.json({ bookmarks }, { status: 200 })
  } catch (error) {
    console.error('[BOOKMARKS_GET_ALL_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}