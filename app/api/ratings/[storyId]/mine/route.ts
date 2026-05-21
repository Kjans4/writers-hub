// app/api/ratings/[storyId]/mine/route.ts
// GET — fetch the current user's rating for a story.
// Returns null rating if the user hasn't rated yet.
//
// Response:
//   { rating: { prose, plot, characters, pacing, world, dismissed_count } | null }

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ rating: null })
  }

  const { data, error } = await supabase
    .from('ratings')
    .select('prose, plot, characters, pacing, world, dismissed_count, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('published_story_id', storyId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rating: data ?? null })
}