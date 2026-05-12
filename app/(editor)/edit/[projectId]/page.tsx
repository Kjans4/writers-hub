// app/(editor)/project/[projectId]/page.tsx
// Project index page — shown when no chapter is selected.
// Updated for Chunk 1: checks if the project has a published story
// and shows the appropriate CTA (Publish Story or Manage Publishing).

import { createClient } from '@/lib/supabase/server'
import ProjectIndexClient from '@/components/layout/ProjectIndexClient'

interface ProjectIndexProps {
  params: { projectId: string }
}

export default async function ProjectIndexPage({ params }: ProjectIndexProps) {
  const supabase = await createClient()

  // Check if this project already has a published story
  const { data: publishedStory } = await supabase
    .from('published_stories')
    .select('id, slug, title, is_published')
    .eq('project_id', params.projectId)
    .maybeSingle()

  return (
    <ProjectIndexClient
      projectId={params.projectId}
      publishedStory={publishedStory ?? null}
    />
  )
}