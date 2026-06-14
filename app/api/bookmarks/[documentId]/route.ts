// app/api/bookmarks/[documentId]/route.ts
// GET  — is this chapter bookmarked by the current user?
// POST — toggle: create if absent, delete if present.
//
// Fix B: published_story_id is stored as NULL when the chapter's project
//        has no published_stories row yet. The column is NULLABLE in the
//        corrected migration, so the insert no longer 500s.
//
// Fix I: params is awaited (required in Next.js 14.2+ App Router).
//
// GET response:
//   { bookmarked: boolean, bookmark_id: string | null }
//
// POST response:
//   { bookmarked: boolean, bookmark_id: string | null }

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ── GET /api/bookmarks/[documentId] ──────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  // Fix I — await params
  const { documentId } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Not logged in — not bookmarked, no error
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

// ── POST /api/bookmarks/[documentId] ─────────────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  // Fix I — await params
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
  // Resolve the chapter's project_id so we can look up published_stories.
  const { data: doc } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  // Fix B: story lookup — NULL is a valid value here.
  // The column is NULLABLE in the migration, so inserting null does not
  // violate the FK constraint. This allows bookmarking chapters from
  // projects that haven't been published yet (e.g. direct-link previews).
  const { data: story } = await supabase
    .from('published_stories')
    .select('id')
    .eq('project_id', doc.project_id)
    .eq('is_published', true)
    .maybeSingle()

  const { data: inserted, error: insertError } = await supabase
    .from('bookmarks')
    .insert({
      user_id:            user.id,
      document_id:        documentId,
      published_story_id: story?.id ?? null,  // NULL when not yet published
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