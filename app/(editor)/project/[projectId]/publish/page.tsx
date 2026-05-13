// app/(editor)/project/[projectId]/publish/page.tsx
// Publish wizard / manage publishing route.
// If story already published → ManagePublishing.
// If not → PublishWizard.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublishWizard from '@/components/publish/PublishWizard'
import ManagePublishing from '@/components/publish/ManagePublishing'

interface PublishPageProps {
  params: { projectId: string }
}

export default async function PublishPage({ params }: PublishPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load project
  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', params.projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  // Load Canon branch chapters
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', params.projectId)
    .eq('is_canon', true)
    .single()

  const chapters = canonBranch ? (await supabase
    .from('documents')
    .select('id, title, order_index, is_published')
    .eq('project_id', params.projectId)
    .eq('branch_id', canonBranch.id)
    .eq('type', 'chapter')
    .order('order_index', { ascending: true })
  ).data ?? [] : []

  // Check for existing published story
  const { data: existingStory } = await supabase
    .from('published_stories')
    .select('*')
    .eq('project_id', params.projectId)
    .maybeSingle()

  if (existingStory) {
    return (
      <ManagePublishing
        project={project}
        story={existingStory as any}
        chapters={chapters as any}
      />
    )
  }

  return (
    <PublishWizard
      project={project}
      chapters={chapters as any}
    />
  )
}