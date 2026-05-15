// app/api/annotations/highlights/document/[documentId]/route.ts
// GET — fetch all highlights for the current user on a specific chapter.
//
// Separated from the [id] routes to avoid Next.js dynamic slug conflicts.
// Called as: GET /api/annotations/highlights/document/<documentId>
//
// Returns both fresh and stale highlights so the client can:
//   - render fresh ones via HighlightLayer
//   - show StaleHighlightBanner for stale ones
//
// Response shape:
//   {
//     highlights: Array<{
//       id, paragraph_key, start_offset, end_offset,
//       selected_text, color, note, is_public, is_stale,
//     }>
//   }

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Unauthenticated — return empty array, not an error.
    // The client shows a "log in to save highlights" tooltip instead.
    return NextResponse.json({ highlights: [] })
  }

  const { data, error } = await supabase
    .from('highlights')
    .select(
      'id, paragraph_key, start_offset, end_offset, selected_text, color, note, is_public, is_stale'
    )
    .eq('document_id', params.documentId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ highlights: data ?? [] })
}