// app/api/annotations/inline-comments/[id]/delete/route.ts
// POST — soft-delete a comment.
// The row stays in the DB but is_deleted = true so it no longer
// appears in threads or bubble counts.
// Both the comment owner and the story author can soft-delete.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // RLS policies "inline_comments_update_own" and
  // "inline_comments_update_story_author" govern which rows this user can update.
  const { data, error } = await supabase
    .from('inline_comments')
    .update({ is_deleted: true })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) {
    return NextResponse.json(
      { error: 'Comment not found or not authorized' },
      { status: 404 }
    )
  }

  return NextResponse.json({ ok: true })
}