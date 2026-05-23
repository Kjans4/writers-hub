// app/(editor)/project/[projectId]/publish/page.tsx
// Publish wizard / manage publishing route.
// If story already published → ManagePublishing.
// If not → PublishWizard.
// This file was missing — that's why "Publish Story" was redirecting to dashboard.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublishWizard from '@/components/publish/PublishWizard'
import ManagePublishing from '@/components/publish/ManagePublishing'

interface PublishPageProps {
  params: { projectId: string }
}

export default async function PublishPage({ params }: PublishPageProps) {
  const supabase = await createClient()

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { projectId } = params

  // Guard: projectId must exist and belong to this user
  if (!projectId || projectId === 'undefined') {
    redirect('/dashboard')
  }

  // Load project — must belong to this user
  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  // Load Canon branch
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_canon', true)
    .single()

  // Load Canon chapters
  const chapters =
    canonBranch
      ? (
          await supabase
            .from('documents')
            .select('id, title, order_index, is_published')
            .eq('project_id', projectId)
            .eq('branch_id', canonBranch.id)
            .eq('type', 'chapter')
            .order('order_index', { ascending: true })
        ).data ?? []
      : []

  // Check if this project already has a published story
  const { data: existingStory } = await supabase
    .from('published_stories')
    .select(`
      *,
      genres ( name, slug, color )
    `)
    .eq('project_id', projectId)
    .maybeSingle()

  // If already published → show ManagePublishing
  if (existingStory) {
    // Fetch current tags for this story
    const { data: storyTagRows } = await supabase
      .from('story_tags')
      .select('tags ( name )')
      .eq('published_story_id', existingStory.id)

    const tags = (storyTagRows ?? [])
      .map((r: any) => (Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name))
      .filter(Boolean) as string[]

    const genreRaw = Array.isArray(existingStory.genres)
      ? existingStory.genres[0]
      : existingStory.genres

    return (
      <ManagePublishing
        project={project}
        story={{ ...existingStory, genre_id: existingStory.genre_id ?? null }}
        chapters={chapters as any}
        initialGenreName={genreRaw?.name ?? null}
        initialTags={tags}
      />
    )
  }

  // Not yet published → show PublishWizard
  return (
    <PublishWizard
      project={project}
      chapters={chapters as any}
    />
  )
}