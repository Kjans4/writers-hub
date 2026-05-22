// app/api/ink/test-add/route.ts
// POST — add 500 test Ink to the current user's balance.
// Only works when ENABLE_TEST_INK=true (server-side env, no NEXT_PUBLIC_ prefix).
// Uses supabaseAdmin to bypass RLS on ink_balances.
//
// Response: { new_balance: number }

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const TEST_AMOUNT = 500

export async function POST() {
  // Server-side guard — ENABLE_TEST_INK (not NEXT_PUBLIC_)
  if (process.env.ENABLE_TEST_INK !== 'true') {
    return NextResponse.json(
      { error: 'Test Ink is not available in this environment.' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Increment balance using SECURITY DEFINER function
  const { error: rpcError } = await supabaseAdmin.rpc('increment_ink_balance', {
    p_user_id: user.id,
    p_amount:  TEST_AMOUNT,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  // Record the transaction
  await supabaseAdmin
    .from('ink_transactions')
    .insert({
      from_user_id: null,
      to_user_id:   user.id,
      type:         'test_add',
      amount:       TEST_AMOUNT,
      document_id:  null,
    })

  // Fetch new balance to return
  const { data: balanceRow } = await supabaseAdmin
    .from('ink_balances')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ new_balance: balanceRow?.balance ?? TEST_AMOUNT })
}