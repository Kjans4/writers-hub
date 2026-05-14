// app/(reader)/genre/[slug]/page.tsx
// Genre browse page — queries Supabase directly (no internal fetch).

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import GenrePage from '@/components/genre/GenrePage'

interface GenreRouteProps {
  params:       { slug: string }
  searchParams: { sort?: string; status?: string; tag?: string; page?: string }
}

export default async function GenreRoute({ params, searchParams }: GenreRouteProps) {
  const supabase = await createClient()
  const sort     = searchParams.sort   ?? 'newest'
  const status   = searchParams.status ?? ''
  const tag      = searchParams.tag    ?? ''
  const page     = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const limit    = 12
  const offset   = (page - 1) * limit

  // Resolve genre
  const { data: genre } = await supabase
    .from('genres')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!genre) notFound()

  // Build stories query
  let storiesQuery = supabase
    .from('published_stories')
    .select(`
      id, slug, title, hook, cover_url, status, content_rating, published_at,
      profiles ( display_name, username, avatar_url )
    `)
    .eq('is_published', true)
    .eq('genre_id', genre.id)

  if (status) storiesQuery = storiesQuery.eq('status', status)

  if (sort === 'most_saved') {
    storiesQuery = storiesQuery.order('save_count',   { ascending: false })
  } else if (sort === 'most_read') {
    storiesQuery = storiesQuery.order('total_reads',  { ascending: false })
  } else {
    storiesQuery = storiesQuery.order('published_at', { ascending: false })
  }

  storiesQuery = storiesQuery.range(offset, offset + limit - 1)

  const { data: rawStories } = await storiesQuery
  let stories = rawStories ?? []

  // Tag filter
  if (tag) {
    const { data: tagRow } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tag)
      .single()

    if (tagRow) {
      const { data: storyTagRows } = await supabase
        .from('story_tags')
        .select('published_story_id')
        .eq('tag_id', tagRow.id)

      const taggedIds = new Set((storyTagRows ?? []).map((r: any) => r.published_story_id))
      stories = stories.filter((s: any) => taggedIds.has(s.id))
    } else {
      stories = []
    }
  }

  // Attach tag names
  const storyIds = stories.map((s: any) => s.id)
  const tagsByStory: Record<string, string[]> = {}

  if (storyIds.length > 0) {
    const { data: storyTagData } = await supabase
      .from('story_tags')
      .select('published_story_id, tags ( name )')
      .in('published_story_id', storyIds)

    for (const row of storyTagData ?? []) {
      const r     = row as any
      const sid   = r.published_story_id
      const tname = Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name
      if (!tname) continue
      if (!tagsByStory[sid]) tagsByStory[sid] = []
      tagsByStory[sid].push(tname)
    }
  }

  // Popular tags for this genre
  const { data: allStoryRows } = await supabase
    .from('published_stories')
    .select('id')
    .eq('genre_id', genre.id)
    .eq('is_published', true)

  const allStoryIds = (allStoryRows ?? []).map((r: any) => r.id)
  const popularTags: string[] = []

  if (allStoryIds.length > 0) {
    const { data: genreTagRows } = await supabase
      .from('story_tags')
      .select('tag_id, tags ( name )')
      .in('published_story_id', allStoryIds)

    const tagCount = new Map<string, { name: string; count: number }>()
    for (const row of genreTagRows ?? []) {
      const r   = row as any
      const t   = Array.isArray(r.tags) ? r.tags[0] : r.tags
      if (!t) continue
      const ex  = tagCount.get(r.tag_id)
      if (ex) { ex.count += 1 } else { tagCount.set(r.tag_id, { name: t.name, count: 1 }) }
    }

    Array.from(tagCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .forEach((t) => popularTags.push(t.name))
  }

  const enriched = stories.map((s: any) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    return {
      id:              s.id,
      slug:            s.slug,
      title:           s.title,
      hook:            s.hook,
      cover_url:       s.cover_url,
      status:          s.status,
      content_rating:  s.content_rating,
      genre_name:      genre.name,
      genre_slug:      genre.slug,
      genre_color:     genre.color,
      tag_names:       tagsByStory[s.id] ?? [],
      author_name:     profile?.display_name ?? profile?.username ?? null,
      author_username: profile?.username ?? null,
      author_avatar:   profile?.avatar_url ?? null,
    }
  })

  return (
    <Suspense fallback={null}>
      <GenrePage
        genre={genre}
        stories={enriched}
        popularTags={popularTags}
        hasMore={enriched.length === limit}
        currentPage={page}
        currentSort={sort}
        currentStatus={status}
        currentTag={tag}
      />
    </Suspense>
  )
}