// app/api/genres/[slug]/tags/route.ts
// GET /api/genres/[slug]/tags
// Returns top 6 tags by frequency within stories of this genre.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // Next.js 15 Async Params Type
) {
  try {
    // Next.js 15 forward-compatibility: await dynamic parameters before extraction
    const { slug } = await params
    const supabase = await createClient()

    // 1. Resolve genre ID from slug
    const { data: genre, error: genreErr } = await supabase
      .from('genres')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (genreErr) throw genreErr
    if (!genre) return NextResponse.json({ tags: [] }, { status: 200 })

    // 2. Fetch Story IDs belonging to this genre
    const { data: storyRows, error: storyErr } = await supabase
      .from('published_stories')
      .select('id')
      .eq('genre_id', genre.id)
      .eq('is_published', true)

    if (storyErr) throw storyErr

    const storyIds = (storyRows ?? []).map((r: any) => r.id)
    if (storyIds.length === 0) return NextResponse.json({ tags: [] }, { status: 200 })

    // 3. Fetch tags associated with those found stories
    const { data: storyTagRows, error: tagErr } = await supabase
      .from('story_tags')
      .select('tag_id, tags ( name )')
      .in('published_story_id', storyIds)

    if (tagErr) throw tagErr

    // 4. In-memory reduction to aggregate occurrences per tag within this genre context
    const tagCount = new Map<string, { name: string; count: number }>()
    for (const row of storyTagRows ?? []) {
      const r = row as any
      const tag = Array.isArray(r.tags) ? r.tags[0] : r.tags
      if (!tag) continue
      
      const existing = tagCount.get(r.tag_id)
      if (existing) {
        existing.count += 1
      } else {
        tagCount.set(r.tag_id, { name: tag.name, count: 1 })
      }
    }

    // 5. Sort descending by count weight and extract the top 6 names
    const tags = Array.from(tagCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((t) => t.name)

    return NextResponse.json({ tags }, { status: 200 })
  } catch (error) {
    console.error('[GENRE_TAGS_GET_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}