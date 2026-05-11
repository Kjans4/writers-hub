// app/api/story/[slug]/route.ts
// GET — public story metadata + published chapter list.
// No auth required. Used by the story info page (/story/[slug]).
//
// Chapter positions are computed here (server-side) by sorting
// published chapters by order_index and assigning 1-based positions.
// The client never sees raw order_index values — only positions.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()

  // Fetch the published story
  const { data: story } = await supabase
    .from('published_stories')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  // Fetch the Canon branch for this project
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', story.project_id)
    .eq('is_canon', true)
    .single()

  if (!canonBranch) {
    return NextResponse.json({ error: 'Story has no canon branch' }, { status: 500 })
  }

  // Fetch ALL chapters (published + draft) so we can show draft count in the drawer
  const { data: allChapters } = await supabase
    .from('documents')
    .select('id, title, order_index, is_published, published_at')
    .eq('project_id', story.project_id)
    .eq('branch_id', canonBranch.id)
    .eq('type', 'chapter')
    .order('order_index', { ascending: true })

  const chapters = allChapters ?? []

  // Separate published from draft
  const publishedChapters = chapters.filter((c) => c.is_published)
  const draftCount = chapters.length - publishedChapters.length

  // Assign 1-based positions to published chapters
  const publishedWithPositions = publishedChapters.map((ch, index) => ({
    document_id:  ch.id,
    position:     index + 1,
    title:        ch.title,
    published_at: ch.published_at,
  }))

  // Fetch author profile
  const { data: author } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, bio')
    .eq('id', story.user_id)
    .single()

  return NextResponse.json({
    story: {
      id:             story.id,
      slug:           story.slug,
      title:          story.title,
      hook:           story.hook,
      description:    story.description,
      cover_url:      story.cover_url,
      content_rating: story.content_rating,
      status:         story.status,
      published_at:   story.published_at,
    },
    chapters:    publishedWithPositions,
    draft_count: draftCount,
    author:      author ?? null,
  })
}