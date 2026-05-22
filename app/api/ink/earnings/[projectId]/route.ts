// app/api/ink/earnings/[projectId]/route.ts
// GET — author earnings for a specific project.
// Must be the project owner to access.
//
// Response:
//   {
//     total_earned: number,
//     available:    number,   (total_earned * 0.9, floored)
//     by_chapter:   Array<{ document_id, chapter_number, chapter_title, total_tips }>,
//     recent_tips:  Array<{ amount, chapter_title, created_at }>,
//   }

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { calculateAvailable } from '@/lib/ink/bundles'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  // Auth + ownership check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Fetch the author's balance to get total_earned
  const { data: balanceRow } = await supabaseAdmin
    .from('ink_balances')
    .select('total_earned')
    .eq('user_id', user.id)
    .maybeSingle()

  const totalEarned = balanceRow?.total_earned ?? 0
  const available   = calculateAvailable(totalEarned)

  // Fetch all published chapter IDs for this project
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_canon', true)
    .single()

  if (!canonBranch) {
    return NextResponse.json({
      total_earned: totalEarned,
      available,
      by_chapter:  [],
      recent_tips: [],
    })
  }

  const { data: chapters } = await supabase
    .from('documents')
    .select('id, title, order_index')
    .eq('project_id', projectId)
    .eq('branch_id', canonBranch.id)
    .eq('type', 'chapter')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  if (!chapters || chapters.length === 0) {
    return NextResponse.json({
      total_earned: totalEarned,
      available,
      by_chapter:  [],
      recent_tips: [],
    })
  }

  const chapterIds = chapters.map((c) => c.id)

  // Fetch all tip transactions for these chapters
  const { data: transactions } = await supabaseAdmin
    .from('ink_transactions')
    .select('amount, document_id, created_at')
    .eq('to_user_id', user.id)
    .eq('type', 'tip')
    .in('document_id', chapterIds)
    .order('created_at', { ascending: false })

  const txns = transactions ?? []

  // Aggregate tips per chapter
  const chapterMap = new Map(
    chapters.map((c, i) => [
      c.id,
      { title: c.title, position: i + 1, total: 0 },
    ])
  )

  for (const txn of txns) {
    if (txn.document_id && chapterMap.has(txn.document_id)) {
      chapterMap.get(txn.document_id)!.total += txn.amount
    }
  }

  const byChapter = Array.from(chapterMap.entries())
    .map(([document_id, { title, position, total }]) => ({
      document_id,
      chapter_number: position,
      chapter_title:  title,
      total_tips:     total,
    }))
    .filter((c) => c.total_tips > 0)
    .sort((a, b) => b.total_tips - a.total_tips)

  // Recent tips (last 50, with chapter title resolved)
  const recentTips = txns.slice(0, 50).map((txn) => {
    const ch = txn.document_id ? chapterMap.get(txn.document_id) : null
    return {
      amount:        txn.amount,
      chapter_title: ch?.title ?? 'Unknown chapter',
      created_at:    txn.created_at,
    }
  })

  return NextResponse.json({
    total_earned: totalEarned,
    available,
    by_chapter:   byChapter,
    recent_tips:  recentTips,
  })
}