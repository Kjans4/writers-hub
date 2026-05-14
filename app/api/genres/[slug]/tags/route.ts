// app/api/genres/[slug]/tags/route.ts
// GET /api/genres/[slug]/tags
// Returns top 6 tags by frequency within stories of this genre.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()

  const { data: genre } = await supabase
    .from('genres')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!genre) return NextResponse.json({ tags: [] })

  // Story IDs in this genre
  const { data: storyRows } = await supabase
    .from('published_stories')
    .select('id')
    .eq('genre_id', genre.id)
    .eq('is_published', true)

  const storyIds = (storyRows ?? []).map((r: any) => r.id)
  if (storyIds.length === 0) return NextResponse.json({ tags: [] })

  // Tags for those stories
  const { data: storyTagRows } = await supabase
    .from('story_tags')
    .select('tag_id, tags ( name )')
    .in('published_story_id', storyIds)

  // Count occurrences per tag within this genre
  const tagCount = new Map<string, { name: string; count: number }>()
  for (const row of storyTagRows ?? []) {
    const r   = row as any
    const tag = Array.isArray(r.tags) ? r.tags[0] : r.tags
    if (!tag) continue
    const existing = tagCount.get(r.tag_id)
    if (existing) {
      existing.count += 1
    } else {
      tagCount.set(r.tag_id, { name: tag.name, count: 1 })
    }
  }

  const tags = Array.from(tagCount.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((t) => t.name)

  return NextResponse.json({ tags })
}