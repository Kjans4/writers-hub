// app/(reader)/story/[slug]/page.tsx
// Public story info page. No auth required.
// Shows cover, title, author, hook, description, chapter list,
// and a "Start Reading" / "Continue Reading" CTA.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StoryPage from '@/components/story/StoryPage'

interface StoryRouteProps {
  params: { slug: string }
}

export default async function StoryRoute({ params }: StoryRouteProps) {
  const supabase = await createClient()

  // Fetch story via the public API shape — replicate the query here
  // server-side to avoid an extra HTTP round-trip from the server.

  const { data: story } = await supabase
    .from('published_stories')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!story) notFound()

  // Canon branch
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', story.project_id)
    .eq('is_canon', true)
    .single()

  if (!canonBranch) notFound()

  // All chapters — published and draft count
  const { data: allChapters } = await supabase
    .from('documents')
    .select('id, title, order_index, is_published, published_at')
    .eq('project_id', story.project_id)
    .eq('branch_id', canonBranch.id)
    .eq('type', 'chapter')
    .order('order_index', { ascending: true })

  const chapters    = allChapters ?? []
  const published   = chapters.filter((c) => c.is_published)
  const draftCount  = chapters.length - published.length

  const publishedWithPositions = published.map((ch, index) => ({
    document_id:  ch.id,
    position:     index + 1,
    title:        ch.title,
    published_at: ch.published_at ?? '',
  }))

  // Author profile
  const { data: author } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, bio')
    .eq('id', story.user_id)
    .single()

  // Reading progress for the current user (if logged in)
  const { data: { user } } = await supabase.auth.getUser()

  let resumePosition: number | null = null

  if (user) {
    const { data: progress } = await supabase
      .from('reading_progress')
      .select('current_document_id')
      .eq('published_story_id', story.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (progress?.current_document_id) {
      const idx = published.findIndex(
        (c) => c.id === progress.current_document_id
      )
      if (idx !== -1) resumePosition = idx + 1
    }
  }

  return (
    <StoryPage
      story={story}
      chapters={publishedWithPositions}
      draftCount={draftCount}
      author={author ?? null}
      resumePosition={resumePosition}
      isLoggedIn={!!user}
    />
  )
}