// app/api/lists/route.ts
// GET  — Fetch all reading lists owned by the current user.
// POST — Create a new, empty reading list.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch lists ordered by newest creation date
    const { data: lists, error } = await supabase
      .from('reading_lists')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ lists: lists || [] }, { status: 200 })
  } catch (error) {
    console.error('[READING_LISTS_GET_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Reading list name is required' },
        { status: 400 }
      )
    }

    // Insert new list — RLS automatically stamps and verifies user_id
    const { data: newList, error } = await supabase
      .from('reading_lists')
      .insert({
        user_id: user.id,
        name: name.trim()
      })
      .select('id, name, created_at')
      .single()

    if (error) throw error

    return NextResponse.json({ list: newList }, { status: 201 })
  } catch (error) {
    console.error('[READING_LISTS_POST_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}