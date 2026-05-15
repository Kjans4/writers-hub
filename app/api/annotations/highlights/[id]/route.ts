// app/api/annotations/highlights/[id]/route.ts
// PATCH  — update a highlight (color, note, is_public, or dismiss stale).
// DELETE — delete a highlight.
//
// PATCH body (all fields optional):
//   color      string
//   note       string | null
//   is_public  boolean
//   is_stale   boolean   ← used by client to dismiss a stale highlight
//                          (sets is_stale = false after reader acknowledges)

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Only allow these fields to be updated from the client.
  // user_id, document_id, paragraph_key, offsets are immutable after creation.
  const allowed = ['color', 'note', 'is_public', 'is_stale']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields provided for update' },
      { status: 400 }
    )
  }

  // RLS "highlights_update_own" policy ensures the user can only update
  // their own highlights — but we add the user_id check here too for
  // an explicit 404 rather than a silent no-op on wrong ownership.
  const { data, error } = await supabase
    .from('highlights')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Highlight not found or not owned by current user' },
      { status: 404 }
    )
  }

  return NextResponse.json({ highlight: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('highlights')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}