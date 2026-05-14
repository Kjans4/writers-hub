// app/api/tags/[name]/route.ts
// GET /api/tags/[name]
// Returns tag metadata + stories with this tag.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, use_count')
    .eq('name', params.name)
    .single()

  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 })

  const { data: storyTagRows } = await supabase
    .from('story_tags')
    .select('published_story_id')
    .eq('tag_id', tag.id)

  const storyIds = (storyTagRows ?? []).map((r: any) => r.published_story_id)

  if (storyIds.length === 0) return NextResponse.json({ tag, stories: [] })

  const { data: stories } = await supabase
    .from('published_stories')
    .select(`
      id, slug, title, hook, cover_url, status, content_rating,
      profiles ( display_name, username, avatar_url ),
      genres   ( name, slug, color )
    `)
    .in('id', storyIds)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  // Attach all tag names per story
  const tagsByStory: Record<string, string[]> = {}
  if (storyIds.length > 0) {
    const { data: allTagRows } = await supabase
      .from('story_tags')
      .select('published_story_id, tags ( name )')
      .in('published_story_id', storyIds)

    for (const row of allTagRows ?? []) {
      const r     = row as any
      const sid   = r.published_story_id
      const tname = Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name
      if (!tname) continue
      if (!tagsByStory[sid]) tagsByStory[sid] = []
      tagsByStory[sid].push(tname)
    }
  }

  const enriched = (stories ?? []).map((s: any) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    const genre   = Array.isArray(s.genres)   ? s.genres[0]   : s.genres
    return {
      id:              s.id,
      slug:            s.slug,
      title:           s.title,
      hook:            s.hook,
      cover_url:       s.cover_url,
      status:          s.status,
      content_rating:  s.content_rating,
      genre_name:      genre?.name  ?? null,
      genre_slug:      genre?.slug  ?? null,
      genre_color:     genre?.color ?? null,
      tag_names:       tagsByStory[s.id] ?? [],
      author_name:     profile?.display_name ?? profile?.username ?? null,
      author_username: profile?.username     ?? null,
      author_avatar:   profile?.avatar_url   ?? null,
    }
  })

  return NextResponse.json({ tag, stories: enriched })
}