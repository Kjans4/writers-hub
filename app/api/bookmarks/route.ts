// app/api/bookmarks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch bookmarks with the target fields, explicitly asking for published_stories.id
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        document_id,
        created_at,
        documents (
          title
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

    if (error) throw error

    // 2. Map raw database results into the normalized data structure
    const bookmarks = (data || []).map((row: any) => {
      const doc = row.documents
      const story = row.published_stories

      // Defensive fallback safety net (Issue B safety check)
      if (!doc || !story) return null

      return {
        id:              row.id,
        document_id:     row.document_id,
        story_id:        story.id, // ✅ CRITICAL FIX: Add story_id to payload
        chapter_title:   doc.title ?? 'Untitled',
        story_slug:      story.slug,
        story_title:     story.title,
        story_cover_url: story.cover_url ?? null,
        created_at:      row.created_at,
      }
    }).filter(Boolean) // Clear out null structural safety fallbacks safely

    return NextResponse.json({ bookmarks }, { status: 200 })
  } catch (error) {
    console.error('[BOOKMARKS_GET_ALL_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}