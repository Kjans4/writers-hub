// app/api/lists/[listId]/route.ts
// GET    — Fetch specific reading list metadata alongside full story objects
// DELETE — Delete an entire reading list

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Fetch parent metadata 
    const { data: list, error: listErr } = await supabase
      .from('reading_lists')
      .select('id, name, created_at')
      .eq('id', listId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (listErr) throw listErr
    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 })

    // 2. Fetch joined items mapping relationship metrics out to full story fields
    const { data: items, error: itemsErr } = await supabase
      .from('reading_list_items')
      .select(`
        id,
        added_at,
        published_stories (
          id,
          title,
          slug,
          cover_url,
          summary
        )
      `)
      .eq('list_id', listId)
      .order('added_at', { ascending: false })

    if (itemsErr) throw itemsErr

    const stories = (items || []).map((row: any) => row.published_stories).filter(Boolean)

    return NextResponse.json({ list, stories }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('reading_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}