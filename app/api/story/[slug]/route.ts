// app/api/story/[slug]/tags/route.ts
// POST /api/story/[slug]/tags
// Replaces all tags for a story. Auth required — must be story owner.
// NOTE: despite the param name being "slug" (required to match the sibling
// [slug]/route.ts at this path level), the client passes the story's UUID,
// not its slug. We look it up by ID.
// Body: { tags: string[] }  max 5

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeTag } from '@/lib/utils/normalizeTag'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // slug is actually the story UUID (the client sends the ID, not the slug)
  const storyId = slug

  // Verify ownership
  const { data: story } = await supabase
    .from('published_stories')
    .select('id, user_id')
    .eq('id', storyId)
    .single()

  if (!story || story.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const rawTags: string[] = (body.tags ?? []).slice(0, 5)
  const normalized = [...new Set(rawTags.map(normalizeTag).filter(Boolean))]

  // Delete all existing story_tags for this story
  await supabase
    .from('story_tags')
    .delete()
    .eq('published_story_id', story.id)

  // Upsert each tag and link to story
  for (const name of normalized) {
    // Get existing tag
    let { data: existingTag } = await supabase
      .from('tags')
      .select('id, use_count')
      .eq('name', name)
      .single()

    if (!existingTag) {
      // Insert new tag
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ name, use_count: 1 })
        .select('id, use_count')
        .single()
      existingTag = newTag
    } else {
      // Increment use_count
      await supabase
        .from('tags')
        .update({ use_count: existingTag.use_count + 1 })
        .eq('id', existingTag.id)
    }

    if (existingTag) {
      await supabase
        .from('story_tags')
        .insert({ published_story_id: story.id, tag_id: existingTag.id })
    }
  }

  return NextResponse.json({ ok: true })
}