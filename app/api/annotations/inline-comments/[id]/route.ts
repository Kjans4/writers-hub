// app/api/annotations/inline-comments/[id]/route.ts
// PATCH — edit the content of an existing comment (own only).
//
// Body:
//   content  string  — new comment text (1–280 chars)

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { content: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { content } = body

  if (!content || content.length < 1 || content.length > 280) {
    return NextResponse.json(
      { error: 'content must be between 1 and 280 characters' },
      { status: 400 }
    )
  }

  // RLS "inline_comments_update_own" policy enforces user_id = auth.uid()
  const { data, error } = await supabase
    .from('inline_comments')
    .update({ content: content.trim() })
    .eq('id', params.id)
    .eq('user_id', user.id)     // belt-and-suspenders on top of RLS
    .select('id, content, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  return NextResponse.json({ comment: data })
}