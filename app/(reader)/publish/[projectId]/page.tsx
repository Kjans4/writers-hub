// app/(reader)/publish/[projectId]/page.tsx
// If the project has no published story → show PublishWizard (3-step flow).
// If the project already has a published story → show ManagePublishing panel.
// Both states are determined server-side to avoid flash of wrong UI.

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublishWizard from '@/components/publish/PublishWizard'
import ManagePublishing from '@/components/publish/ManagePublishing'

interface PublishPageProps {
  params: { projectId: string }
}

export default async function PublishPage({ params }: PublishPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', params.projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // Check if a published story already exists for this project
  const { data: publishedStory } = await supabase
    .from('published_stories')
    .select('*')
    .eq('project_id', params.projectId)
    .maybeSingle()

  // Fetch all chapters from the Canon branch for the wizard/manager
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', params.projectId)
    .eq('is_canon', true)
    .single()

  const chapters = canonBranch
    ? await supabase
        .from('documents')
        .select('id, title, order_index, is_published')
        .eq('project_id', params.projectId)
        .eq('branch_id', canonBranch.id)
        .eq('type', 'chapter')
        .order('order_index', { ascending: true })
        .then(({ data }) => data ?? [])
    : []

  if (publishedStory) {
    return (
      <ManagePublishing
        project={project}
        story={publishedStory}
        chapters={chapters}
      />
    )
  }

  return (
    <PublishWizard
      project={project}
      chapters={chapters}
    />
  )
}