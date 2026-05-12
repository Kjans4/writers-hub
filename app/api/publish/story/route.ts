// app/api/publish/story/route.ts
// POST — create a published_story record and set is_published = TRUE on
//         selected chapter documents.
// PATCH — update story metadata (title, hook, description, rating, status, cover).
//
// Slug is generated server-side: slugify title, check uniqueness,
// append first 6 chars of generated UUID on conflict.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ContentRating, StoryStatus } from '@/lib/supabase/types'

// ── Slug helpers ──────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars except hyphens
    .replace(/[\s_]+/g, '-')    // spaces and underscores → hyphens
    .replace(/--+/g, '-')       // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')    // strip leading/trailing hyphens
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
  storyId: string
): Promise<string> {
  const base = slugify(title)

  // Check if base slug is available
  const { data: existing } = await supabase
    .from('published_stories')
    .select('id')
    .eq('slug', base)
    .maybeSingle()

  if (!existing) return base

  // Conflict — append first 6 chars of the story UUID
  return `${base}-${storyId.slice(0, 6)}`
}

// ── POST /api/publish/story ───────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    project_id,
    title,
    hook,
    description,
    cover_url,
    content_rating,
    status,
    chapter_ids,
  }: {
    project_id:     string
    title:          string
    hook:           string
    description:    string
    cover_url:      string | null
    content_rating: ContentRating
    status:         StoryStatus
    chapter_ids:    string[]
  } = body

  // Validate required fields
  if (!project_id || !title || !chapter_ids?.length) {
    return NextResponse.json(
      { error: 'project_id, title, and at least one chapter_id are required' },
      { status: 400 }
    )
  }

  // Verify the project belongs to this user
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Check if this project already has a published story
  const { data: existing } = await supabase
    .from('published_stories')
    .select('id')
    .eq('project_id', project_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'This project already has a published story. Use PATCH to update it.' },
      { status: 409 }
    )
  }

  // Generate a temporary UUID to use for slug conflict resolution
  const tempId = crypto.randomUUID()
  const slug = await generateUniqueSlug(supabase, title, tempId)

  // Create the published story record
  const { data: story, error: storyError } = await supabase
    .from('published_stories')
    .insert({
      project_id,
      user_id: user.id,
      slug,
      title:          title.trim(),
      hook:           hook?.trim()        || null,
      description:    description?.trim() || null,
      cover_url:      cover_url           || null,
      content_rating: content_rating      || 'teen',
      status:         status              || 'ongoing',
      is_published:   true,
    })
    .select()
    .single()

  if (storyError || !story) {
    console.error('Error creating published story:', storyError)
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }

  // Flip selected chapters to published
  const { error: chaptersError } = await supabase
    .from('documents')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .in('id', chapter_ids)
    .eq('project_id', project_id)  // safety: only touch chapters from this project

  if (chaptersError) {
    console.error('Error publishing chapters:', chaptersError)
    // Story was created but chapters failed — still return the story
    // so the writer can retry from ManagePublishing
    return NextResponse.json(
      { story, warning: 'Story created but some chapters failed to publish' },
      { status: 207 }
    )
  }

  return NextResponse.json({ story }, { status: 201 })
}

// ── PATCH /api/publish/story ──────────────────────────────────
// Update story metadata. Body fields are all optional.

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, title, hook, description, cover_url, content_rating, status } = body

  if (!id) {
    return NextResponse.json({ error: 'Story id is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (title         !== undefined) updates.title          = title.trim()
  if (hook          !== undefined) updates.hook           = hook?.trim() || null
  if (description   !== undefined) updates.description    = description?.trim() || null
  if (cover_url     !== undefined) updates.cover_url      = cover_url || null
  if (content_rating !== undefined) updates.content_rating = content_rating
  if (status        !== undefined) updates.status         = status

  const { data: story, error } = await supabase
    .from('published_stories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)  // RLS + explicit ownership check
    .select()
    .single()

  if (error || !story) {
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 })
  }

  return NextResponse.json({ story })
}