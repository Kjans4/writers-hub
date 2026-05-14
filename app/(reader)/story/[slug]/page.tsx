// app/(reader)/story/[slug]/page.tsx
// Phase A update: fetches genre and tags, passes to StoryPage.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StoryPage from '@/components/story/StoryPage'

interface StoryRouteProps {
  params: { slug: string }
}

export default async function StoryRoute({ params }: StoryRouteProps) {
  const supabase = await createClient()

  const { data: story } = await supabase
    .from('published_stories')
    .select('*, genres ( name, slug, color )')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!story) notFound()

  const { data: author } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, bio')
    .eq('id', story.user_id)
    .single()

  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', story.project_id)
    .eq('is_canon', true)
    .single()

  let chapters: any[] = []
  let draftCount = 0

  if (canonBranch) {
    const { data: allChapters } = await supabase
      .from('documents')
      .select('id, title, order_index, is_published, published_at')
      .eq('project_id', story.project_id)
      .eq('branch_id', canonBranch.id)
      .eq('type', 'chapter')
      .order('order_index', { ascending: true })

    const published = (allChapters ?? []).filter((c) => c.is_published)
    draftCount = (allChapters ?? []).length - published.length
    chapters   = published.map((ch, i) => ({
      document_id:  ch.id,
      position:     i + 1,
      title:        ch.title,
      published_at: ch.published_at ?? ch.id,
    }))
  }

  // Tags for this story
  const { data: storyTagRows } = await supabase
    .from('story_tags')
    .select('tags ( name )')
    .eq('published_story_id', story.id)

  const tags = (storyTagRows ?? [])
    .map((r: any) => (Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name))
    .filter(Boolean) as string[]

  // Reading progress
  const { data: { user } } = await supabase.auth.getUser()
  let resumePosition: number | null = null

  if (user) {
    const { data: progress } = await supabase
      .from('reading_progress')
      .select('current_document_id')
      .eq('user_id', user.id)
      .eq('published_story_id', story.id)
      .single()

    if (progress?.current_document_id) {
      const idx = chapters.findIndex((ch) => ch.document_id === progress.current_document_id)
      if (idx !== -1) resumePosition = chapters[idx].position
    }
  }

  const genreRaw = Array.isArray(story.genres) ? story.genres[0] : story.genres

  return (
    <StoryPage
      story={story as any}
      chapters={chapters}
      draftCount={draftCount}
      author={author ?? null}
      resumePosition={resumePosition}
      isLoggedIn={!!user}
      genreName={genreRaw?.name   ?? null}
      genreSlug={genreRaw?.slug   ?? null}
      genreColor={genreRaw?.color ?? null}
      tags={tags}
    />
  )
}