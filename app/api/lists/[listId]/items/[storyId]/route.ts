// app/api/lists/[listId]/items/[storyId]/route.ts
// DELETE — Remove a story from a specific reading list.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string; storyId: string }> }
) {
  try {
    const { listId, storyId } = await params // Next.js 15 forward-compatibility (Issue I)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Explicit security boundary: Verify ownership of the parent reading list 
    // before dropping rows from the items junction table.
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

    // Execute the deletion
    const { error } = await supabase
      .from('reading_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('story_id', storyId)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[READING_LIST_ITEMS_DELETE_ERROR]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}