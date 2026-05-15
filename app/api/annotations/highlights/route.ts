// app/api/annotations/highlights/route.ts
// POST — create a new highlight.
//
// Body:
//   document_id   string
//   paragraph_key string
//   start_offset  number
//   end_offset    number
//   selected_text string
//   color         string   ('#FEF08A')
//   note          string | null
//   is_public     boolean

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    document_id,
    paragraph_key,
    start_offset,
    end_offset,
    selected_text,
    color = '#FEF08A',
    note = null,
    is_public = false,
  } = body

  // ── Validate required fields ──────────────────────────────
  if (
    !document_id ||
    !paragraph_key ||
    start_offset === undefined ||
    end_offset === undefined ||
    !selected_text
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: document_id, paragraph_key, start_offset, end_offset, selected_text' },
      { status: 400 }
    )
  }

  if (typeof start_offset !== 'number' || typeof end_offset !== 'number') {
    return NextResponse.json(
      { error: 'start_offset and end_offset must be numbers' },
      { status: 400 }
    )
  }

  if (start_offset >= end_offset) {
    return NextResponse.json(
      { error: 'start_offset must be less than end_offset' },
      { status: 400 }
    )
  }

  // ── Insert ────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('highlights')
    .insert({
      user_id: user.id,
      document_id,
      paragraph_key,
      start_offset,
      end_offset,
      selected_text,
      color,
      note: note ?? null,
      is_public: is_public ?? false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ highlight: data }, { status: 201 })
}