// app/(reader)/tag/[name]/page.tsx
// Tag browse page — queries Supabase directly.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import TagPage from '@/components/tag/TagPage'

interface TagRouteProps {
  params: { name: string }
}

export default async function TagRoute({ params }: TagRouteProps) {
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, use_count')
    .eq('name', params.name)
    .single()

  if (!tag) notFound()

  const { data: storyTagRows } = await supabase
    .from('story_tags')
    .select('published_story_id')
    .eq('tag_id', tag.id)

  const storyIds = (storyTagRows ?? []).map((r: any) => r.published_story_id)

  let stories: any[] = []

  if (storyIds.length > 0) {
    const { data: rawStories } = await supabase
      .from('published_stories')
      .select(`
        id, slug, title, hook, cover_url, status, content_rating,
        profiles ( display_name, username ),
        genres   ( name, slug, color )
      `)
      .in('id', storyIds)
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    // Attach tag names
    const tagsByStory: Record<string, string[]> = {}
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

    stories = (rawStories ?? []).map((s: any) => {
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
        author_username: profile?.username ?? null,
        author_avatar:   profile?.avatar_url ?? null,
      }
    })
  }

  return (
    <Suspense fallback={null}>
      <TagPage
        tagName={tag.name}
        storyCount={tag.use_count}
        stories={stories}
      />
    </Suspense>
  )
}