// app/api/ink/transactions/route.ts
// GET — current user's tip transaction history (sent tips).
// Ordered newest first. Paginated: 20/page via ?page=N.
//
// Response:
//   {
//     transactions: Array<{
//       id, amount, type, chapter_title, created_at
//     }>,
//     has_more: boolean,
//   }

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url    = new URL(req.url)
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const { data, error } = await supabase
    .from('ink_transactions')
    .select('id, amount, type, document_id, created_at')
    .eq('from_user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const txns = data ?? []

  // Resolve chapter titles for tip transactions
  const docIds = txns
    .filter((t) => t.document_id)
    .map((t) => t.document_id as string)

  const titleMap = new Map<string, string>()
  if (docIds.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, title')
      .in('id', docIds)

    for (const doc of docs ?? []) {
      titleMap.set(doc.id, doc.title)
    }
  }

  const shaped = txns.slice(0, PAGE_SIZE).map((t) => ({
    id:            t.id,
    amount:        t.amount,
    type:          t.type,
    chapter_title: t.document_id ? (titleMap.get(t.document_id) ?? 'Unknown') : null,
    created_at:    t.created_at,
  }))

  return NextResponse.json({
    transactions: shaped,
    has_more:     txns.length > PAGE_SIZE,
  })
}