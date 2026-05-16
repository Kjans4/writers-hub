// app/api/lists/[listId]/items/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — Fetch item identifiers within this list to map initial selection state
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: items, error } = await supabase
      .from('reading_list_items')
      .select('story_id')
      .eq('list_id', listId)

    if (error) throw error

    return NextResponse.json({ items: items || [] }, { status: 200 })
  } catch (error) {
    console.error('[READING_LIST_ITEMS_GET_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST — Add a story to a specific reading list.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params // Next.js 15 forward-compatibility
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { storyId } = body

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      )
    }

    // Verify the user actually owns the target reading list before modifying items
    const { data: listCheck } = await supabase
      .from('reading_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!listCheck) {
      return NextResponse.json(
        { error: 'Reading list not found or unauthorized' },
        { status: 404 }
      )
    }

    // Insert story into list items junction table
    const { data: insertedItem, error } = await supabase
      .from('reading_list_items')
      .insert({
        list_id: listId,
        story_id: storyId
      })
      .select('id, list_id, story_id, added_at')
      .single()

    // Handle database unique constraint conflict elegantly
    if (error && error.code === '23505') {
      return NextResponse.json(
        { error: 'Story is already in this reading list' },
        { status: 409 }
      )
    }
    if (error) throw error

    return NextResponse.json({ item: insertedItem }, { status: 201 })
  } catch (error) {
    console.error('[READING_LIST_ITEMS_POST_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}