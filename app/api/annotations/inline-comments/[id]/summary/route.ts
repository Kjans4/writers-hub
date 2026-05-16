// app/api/annotations/inline-comments/[id]/summary/route.ts
// GET — bubble counts for all paragraphs in a chapter.
// [id] here is the documentId (chapter UUID).

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const documentId = params.id

  if (!documentId) {
    return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('inline_comments')
    .select('paragraph_key, user_id')
    .eq('document_id', documentId)
    .eq('is_deleted', false)
    .eq('is_stale', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ bubbles: [] })
  }

  const map = new Map<string, { count: number; has_mine: boolean }>()

  for (const row of data) {
    const existing = map.get(row.paragraph_key) ?? { count: 0, has_mine: false }
    map.set(row.paragraph_key, {
      count:    existing.count + 1,
      has_mine: existing.has_mine || (userId !== null && row.user_id === userId),
    })
  }

  const bubbles = Array.from(map.entries()).map(([paragraph_key, val]) => ({
    paragraph_key,
    count:    val.count,
    has_mine: val.has_mine,
  }))

  return NextResponse.json({ bubbles })
}