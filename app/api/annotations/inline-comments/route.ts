// app/api/annotations/inline-comments/route.ts
// POST — create a new inline comment on a passage.
// One comment per reader per paragraph (enforced by DB UNIQUE constraint).
// If the reader already has a comment on this paragraph, they must use
// PATCH /api/annotations/inline-comments/[id] to edit it instead.
//
// Body:
//   document_id    string  — UUID of the published chapter document
//   paragraph_key  string  — stable UUID from data-paragraph-key attribute
//   start_offset   number  — char offset from paragraph text start
//   end_offset     number  — char offset from paragraph text start
//   selected_text  string  — the actual selected text (for staleness detection)
//   content        string  — the comment text (1–280 chars)

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    document_id:   string
    paragraph_key: string
    start_offset:  number
    end_offset:    number
    selected_text: string
    content:       string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    document_id,
    paragraph_key,
    start_offset,
    end_offset,
    selected_text,
    content,
  } = body

  // ── Validate required fields ──────────────────────────────
  if (!document_id || !paragraph_key || !selected_text || !content) {
    return NextResponse.json(
      { error: 'document_id, paragraph_key, selected_text, and content are required' },
      { status: 400 }
    )
  }

  if (
    typeof start_offset !== 'number' ||
    typeof end_offset !== 'number' ||
    start_offset < 0 ||
    end_offset <= start_offset
  ) {
    return NextResponse.json(
      { error: 'start_offset and end_offset must be valid non-negative integers with end > start' },
      { status: 400 }
    )
  }

  if (content.length < 1 || content.length > 280) {
    return NextResponse.json(
      { error: 'content must be between 1 and 280 characters' },
      { status: 400 }
    )
  }

  // ── Insert ────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('inline_comments')
    .insert({
      user_id:       user.id,
      document_id,
      paragraph_key,
      start_offset,
      end_offset,
      selected_text,
      content:       content.trim(),
    })
    .select('id, paragraph_key, content, appreciation_count, created_at')
    .single()

  if (error) {
    // Unique constraint violation — reader already commented on this paragraph
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You already have a comment on this paragraph. Use PATCH to edit it.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data }, { status: 201 })
}