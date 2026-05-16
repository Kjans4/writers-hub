// app/api/bookmarks/[documentId]/route.ts
// GET  — is this chapter bookmarked by the current user?
// POST — toggle: create if absent, delete if present.
//
// GET response:
//   { bookmarked: boolean, bookmark_id: string | null }
//
// POST response:
//   { bookmarked: boolean, bookmark_id: string | null }
//
// POST creates with published_story_id resolved from the chapter's project.
// If the story is not published, returns 422 — readers should not be able
// to reach an unpublished chapter anyway (chapter page enforces is_published).

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Unauthenticated — not an error, icon just stays in default state
    return NextResponse.json({ bookmarked: false, bookmark_id: null })
  }

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('document_id', documentId)
    .maybeSingle()

  return NextResponse.json({
    bookmarked:  !!data,
    bookmark_id: data?.id ?? null,
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Check for existing bookmark ───────────────────────────
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('document_id', documentId)
    .maybeSingle()

  if (existing) {
    // Already bookmarked → remove it
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existing.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: false, bookmark_id: null })
  }

  // ── Not bookmarked → create it ────────────────────────────
  // Resolve the chapter's project so we can find its published story
  const { data: doc } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  // Resolve published_story_id — required (NOT NULL in schema)
  const { data: story } = await supabase
    .from('published_stories')
    .select('id')
    .eq('project_id', doc.project_id)
    .eq('is_published', true)
    .maybeSingle()

  if (!story) {
    // Should not happen if the reader reached this chapter through normal navigation,
    // but guard explicitly rather than inserting null and violating the constraint.
    return NextResponse.json(
      { error: 'Cannot bookmark a chapter from an unpublished story' },
      { status: 422 }
    )
  }

  const { data: inserted, error: insertError } = await supabase
    .from('bookmarks')
    .insert({
      user_id:            user.id,
      document_id:        documentId,
      published_story_id: story.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    bookmarked:  true,
    bookmark_id: inserted.id,
  })
}