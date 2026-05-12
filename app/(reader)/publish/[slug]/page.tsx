// app/(reader)/publish/[slug]/page.tsx
// If the project has no published story ? show PublishWizard (3-step flow).
// If the project already has a published story ? show ManagePublishing panel.
// Both states are determined server-side to avoid flash of wrong UI.

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublishWizard from '@/components/publish/PublishWizard'
import ManagePublishing from '@/components/publish/ManagePublishing'

interface PublishPageProps {
  params: { slug: string }
}

export default async function PublishPage({ params }: PublishPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slug = params.slug

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', slug)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: publishedStory } = await supabase
    .from('published_stories')
    .select('*')
    .eq('project_id', slug)
    .maybeSingle()

  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', slug)
    .eq('is_canon', true)
    .single()

  const chapters = canonBranch
    ? await supabase
        .from('documents')
        .select('id, title, order_index, is_published')
        .eq('project_id', slug)
        .eq('branch_id', canonBranch.id)
        .order('order_index', { ascending: true })
    : []

  return publishedStory ? (
    <ManagePublishing project={project} publishedStory={publishedStory} />
  ) : (
    <PublishWizard project={project} chapters={chapters} />
  )
}
