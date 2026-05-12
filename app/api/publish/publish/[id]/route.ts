// app/api/publish/chapter/[id]/route.ts
// POST   — publish a single draft chapter (is_published = TRUE)
// DELETE — unpublish a single chapter (is_published = FALSE)
//
// Both operations verify the chapter belongs to a project owned by
// the current user. The published_story must already exist (Phase A
// wizard creates it; these endpoints are for post-publish management).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── POST /api/publish/chapter/[id] ───────────────────────────
// Publish a single chapter.

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chapterId = params.id

  // Verify the chapter exists and belongs to a project owned by this user
  const { data: chapter } = await supabase
    .from('documents')
    .select('id, project_id, type, projects!inner(user_id)')
    .eq('id', chapterId)
    .eq('type', 'chapter')
    .single()

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const projectOwner = (chapter as any).projects?.user_id
  if (projectOwner !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('documents')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', chapterId)

  if (error) {
    return NextResponse.json({ error: 'Failed to publish chapter' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ── DELETE /api/publish/chapter/[id] ─────────────────────────
// Unpublish a single chapter (soft — sets is_published = FALSE).

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chapterId = params.id

  // Verify ownership
  const { data: chapter } = await supabase
    .from('documents')
    .select('id, project_id, type, projects!inner(user_id)')
    .eq('id', chapterId)
    .eq('type', 'chapter')
    .single()

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const projectOwner = (chapter as any).projects?.user_id
  if (projectOwner !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('documents')
    .update({ is_published: false })
    .eq('id', chapterId)

  if (error) {
    return NextResponse.json({ error: 'Failed to unpublish chapter' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}