// app/api/annotations/inline-comments/[id]/[paragraphKey]/route.ts
// GET — returns the full flat comment thread for one paragraph.
// Sorted by appreciation_count DESC (most-loved first), then created_at ASC.
// Paginated: 20 per page. Pass ?page=2 for subsequent pages (1-based).
//
// Response shape:
//   {
//     paragraph_key:  string
//     selected_text:  string   — from the first (oldest) comment on this para
//     is_stale:       boolean  — true if any comment in this para is stale
//     comments: Array<{
//       id:                 string
//       user_id:            string
//       author_name:        string
//       author_avatar:      string | null
//       content:            string
//       appreciation_count: number
//       appreciated_by_me:  boolean
//       is_mine:            boolean
//       created_at:         string
//     }>
//     total:    number
//     has_more: boolean
//   }

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 20

export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string; paragraphKey: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const { documentId, paragraphKey } = params

  if (!documentId || !paragraphKey) {
    return NextResponse.json(
      { error: 'documentId and paragraphKey are required' },
      { status: 400 }
    )
  }

  // ── Parse pagination ──────────────────────────────────────
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // ── Fetch comments for this paragraph ─────────────────────
  // Include profiles join for author display name + avatar.
  const { data: comments, error: commentsError } = await supabase
    .from('inline_comments')
    .select(`
      id,
      user_id,
      content,
      selected_text,
      appreciation_count,
      is_stale,
      created_at,
      profiles (
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('document_id', documentId)
    .eq('paragraph_key', paragraphKey)
    .eq('is_deleted', false)
    .order('appreciation_count', { ascending: false })
    .order('created_at', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 })
  }

  // ── Get total count for pagination ────────────────────────
  const { count, error: countError } = await supabase
    .from('inline_comments')
    .select('*', { count: 'exact', head: true })
    .eq('document_id', documentId)
    .eq('paragraph_key', paragraphKey)
    .eq('is_deleted', false)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  const total = count ?? 0
  const has_more = offset + PAGE_SIZE < total

  if (!comments || comments.length === 0) {
    return NextResponse.json({
      paragraph_key: paragraphKey,
      selected_text: '',
      is_stale:      false,
      comments:      [],
      total:         0,
      has_more:      false,
    })
  }

  // ── Fetch which comments the current user has appreciated ─────────
  let appreciatedIds = new Set<string>()
  if (userId && comments.length > 0) {
    const commentIds = comments.map((c) => c.id)
    const { data: appreciated } = await supabase
      .from('inline_comment_appreciations')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds)

    appreciatedIds = new Set((appreciated ?? []).map((a) => a.comment_id))
  }

  // ── Shape the response ────────────────────────────────────
  // Use the first comment's selected_text as the passage preview.
  // All comments in a paragraph share the same paragraph_key but
  // may have different offsets — we show the oldest one's text.
  const firstComment = comments[0]
  const is_stale = comments.some((c) => c.is_stale)

  const shaped = comments.map((c) => {
    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    const author_name =
      (profile as any)?.display_name ??
      (profile as any)?.username ??
      'A reader'
    const author_avatar = (profile as any)?.avatar_url ?? null

    return {
      id:                 c.id,
      user_id:            c.user_id,
      author_name,
      author_avatar,
      content:            c.content,
      appreciation_count: c.appreciation_count,
      appreciated_by_me:  appreciatedIds.has(c.id),
      is_mine:            userId !== null && c.user_id === userId,
      created_at:         c.created_at,
    }
  })

  return NextResponse.json({
    paragraph_key: paragraphKey,
    selected_text: firstComment.selected_text,
    is_stale,
    comments:      shaped,
    total,
    has_more,
  })
}