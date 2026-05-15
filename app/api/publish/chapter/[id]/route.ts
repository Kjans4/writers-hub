// app/api/publish/chapter/[id]/route.ts
// POST   → publish a chapter (set is_published = true)
// DELETE → unpublish a chapter (set is_published = false)
// PATCH  → update published chapter content.
//          When a published chapter's content changes, all existing
//          highlights and inline_comments for that chapter are marked
//          stale — their DOM anchors may no longer be valid.
//
// PATCH body:
//   content  string   — the new TipTap HTML content

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('documents')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment published_chapter_count on the story
  await supabase.rpc('increment_chapter_count', { story_project_id: params.id })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('documents')
    .update({ is_published: false })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { content } = body

  if (!content || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'content (string) is required' },
      { status: 400 }
    )
  }

  // ── Fetch the current document ────────────────────────────
  // We only mark annotations stale if the content actually changed.
  // If an author clicks "save" without editing, we skip the staleness sweep.
  const { data: existing, error: fetchError } = await supabase
    .from('documents')
    .select('content, is_published')
    .eq('id', params.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const contentChanged = existing.content !== content

  // ── Update document content ───────────────────────────────
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // ── Mark annotations stale if content changed ─────────────
  // This runs for published chapters only — unpublished chapters
  // have no reader annotations to invalidate.
  if (contentChanged && existing.is_published) {
    // Mark highlights stale
    const { error: highlightStaleError } = await supabase
      .from('highlights')
      .update({ is_stale: true })
      .eq('document_id', params.id)
      .eq('is_stale', false)   // only update rows not already stale

    if (highlightStaleError) {
      // Non-fatal — log and continue. The document was saved successfully.
      console.error(
        '[PATCH /api/publish/chapter] Failed to mark highlights stale:',
        highlightStaleError.message
      )
    }

    // Mark inline_comments stale (Phase B — table may not exist yet during
    // Phase A development; the error is caught and ignored gracefully)
    const { error: commentStaleError } = await supabase
      .from('inline_comments')
      .update({ is_stale: true })
      .eq('document_id', params.id)
      .eq('is_stale', false)

    if (commentStaleError) {
      // Expected to fail during Phase A before inline_comments table exists.
      // Safe to ignore.
      console.warn(
        '[PATCH /api/publish/chapter] inline_comments staleness update skipped:',
        commentStaleError.message
      )
    }

    return NextResponse.json({
      ok: true,
      content_changed: true,
      annotations_marked_stale: true,
    })
  }

  return NextResponse.json({
    ok: true,
    content_changed: contentChanged,
    annotations_marked_stale: false,
  })
}