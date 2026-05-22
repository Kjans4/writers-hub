// app/api/ink/tip/route.ts
// POST — send a tip from a reader to an author.
// Uses supabaseAdmin (service role) to bypass RLS for the atomic
// balance update — two user balances must change in the same request.
//
// Steps:
//   1. Authenticate sender
//   2. Validate amount
//   3. Check sender balance (service role read)
//   4. Resolve author from story
//   5. Block self-tips
//   6. Decrement sender balance (SECURITY DEFINER RPC)
//   7. Increment author balance (SECURITY DEFINER RPC)
//   8. Record transaction
//   9. Notify author (new_tip notification)
//
// Body: { amount: number, document_id: string, story_id: string }
// Response: { success: true, new_balance: number }

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse + validate body
  let body: { amount: number; document_id: string; story_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { amount, document_id, story_id } = body

  if (!amount || typeof amount !== 'number' || amount < 1 || !Number.isInteger(amount)) {
    return NextResponse.json(
      { error: 'amount must be a positive integer' },
      { status: 400 }
    )
  }

  if (!document_id || !story_id) {
    return NextResponse.json(
      { error: 'document_id and story_id are required' },
      { status: 400 }
    )
  }

  // 3. Check sender balance via service role (bypasses RLS)
  const { data: balanceRow } = await supabaseAdmin
    .from('ink_balances')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (!balanceRow || balanceRow.balance < amount) {
    return NextResponse.json(
      { error: 'Insufficient Ink balance' },
      { status: 402 }
    )
  }

  // 4. Resolve author
  const { data: story } = await supabaseAdmin
    .from('published_stories')
    .select('user_id, project_id')
    .eq('id', story_id)
    .single()

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  const authorId = story.user_id

  // 5. Prevent self-tipping
  if (authorId === user.id) {
    return NextResponse.json(
      { error: 'You cannot tip your own story' },
      { status: 400 }
    )
  }

  // 6. Decrement sender via SECURITY DEFINER function
  const { error: decrementError } = await supabaseAdmin.rpc(
    'decrement_ink_balance',
    { p_user_id: user.id, p_amount: amount }
  )

  if (decrementError) {
    return NextResponse.json(
      { error: 'Failed to deduct balance' },
      { status: 500 }
    )
  }

  // 7. Increment author via SECURITY DEFINER function
  const { error: incrementError } = await supabaseAdmin.rpc(
    'increment_ink_balance',
    { p_user_id: authorId, p_amount: amount }
  )

  if (incrementError) {
    // Attempt to refund sender on failure
    await supabaseAdmin.rpc('increment_ink_balance', {
      p_user_id: user.id,
      p_amount:  amount,
    })
    return NextResponse.json(
      { error: 'Failed to credit author — your balance has been restored' },
      { status: 500 }
    )
  }

  // 8. Record transaction
  const { data: txn } = await supabaseAdmin
    .from('ink_transactions')
    .insert({
      from_user_id: user.id,
      to_user_id:   authorId,
      type:         'tip',
      amount,
      document_id,
    })
    .select('id')
    .single()

  // 9. Resolve chapter title for notification
  const { data: chapter } = await supabaseAdmin
    .from('documents')
    .select('title')
    .eq('id', document_id)
    .single()

  const chapterTitle = chapter?.title ?? 'a chapter'

  // 10. Notify author (fire-and-forget — non-fatal)
  try {
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id:   authorId,
        type:      'new_tip',
        title:     `A reader tipped ✦ ${amount} on ${chapterTitle}`,
        link:      `/publish/${story.project_id}`,
        entity_id: txn?.id ?? null,
        actor_id:  null,  // anonymous
      })
  } catch {
  }

  return NextResponse.json({
    success:     true,
    new_balance: balanceRow.balance - amount,
  })
}