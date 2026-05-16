// app/api/annotations/inline-comments/[id]/appreciate/route.ts
// POST — toggle appreciation on a comment.
// If the current user has already appreciated this comment → remove it.
// If they haven't → add it.
// The sync_inline_appreciation_count trigger keeps the count in sync.
//
// Response:
//   { appreciated: boolean }   — true = now appreciated, false = removed

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const commentId = params.id

  // ── Check existing appreciation ───────────────────────────
  const { data: existing } = await supabase
    .from('inline_comment_appreciations')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // ── Already appreciated → remove it ───────────────────
    const { error } = await supabase
      .from('inline_comment_appreciations')
      .delete()
      .eq('id', existing.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ appreciated: false })
  } else {
    // ── Not yet appreciated → add it ──────────────────────
    const { error } = await supabase
      .from('inline_comment_appreciations')
      .insert({ comment_id: commentId, user_id: user.id })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ appreciated: true })
  }
}