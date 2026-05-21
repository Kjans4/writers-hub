// app/api/ratings/[storyId]/route.ts
// GET  — story aggregate ratings (per-dimension averages + count)
// POST — submit or update a rating (upsert)
//
// GET response:
//   {
//     aggregate: {
//       prose, plot, characters, pacing, world,  ← per-dim averages (null if none)
//       total:   number,                          ← count of rated rows
//       overall: number | null,                   ← overall average across all dims
//     }
//   }
//
// POST body (at least one dimension required):
//   { prose?, plot?, characters?, pacing?, world? }  — each 1–5 or null

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ratings')
    .select('prose, plot, characters, pacing, world')
    .eq('published_story_id', storyId)
    // Only rows where at least one dimension was rated
    .or('prose.not.is.null,plot.not.is.null,characters.not.is.null,pacing.not.is.null,world.not.is.null')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []
  const total = rows.length

  if (total === 0) {
    return NextResponse.json({
      aggregate: {
        prose: null, plot: null, characters: null, pacing: null, world: null,
        total: 0,
        overall: null,
      },
    })
  }

  // Compute per-dimension averages (only over rows that rated that dimension)
  function dimAvg(key: 'prose' | 'plot' | 'characters' | 'pacing' | 'world') {
    const rated = rows.filter((r) => r[key] != null)
    if (rated.length === 0) return null
    const sum = rated.reduce((acc, r) => acc + (r[key] as number), 0)
    return Math.round((sum / rated.length) * 10) / 10
  }

  const prose      = dimAvg('prose')
  const plot       = dimAvg('plot')
  const characters = dimAvg('characters')
  const pacing     = dimAvg('pacing')
  const world      = dimAvg('world')

  // Overall: average of the per-dimension averages that have data
  const dims = [prose, plot, characters, pacing, world].filter((v) => v !== null) as number[]
  const overall = dims.length > 0
    ? Math.round((dims.reduce((a, b) => a + b, 0) / dims.length) * 10) / 10
    : null

  return NextResponse.json({
    aggregate: { prose, plot, characters, pacing, world, total, overall },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    prose?:      number | null
    plot?:       number | null
    characters?: number | null
    pacing?:     number | null
    world?:      number | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { prose, plot, characters, pacing, world } = body

  // Validate: at least one dimension must be rated
  const hasAtLeastOne = [prose, plot, characters, pacing, world].some(
    (v) => v != null && v >= 1 && v <= 5
  )
  if (!hasAtLeastOne) {
    return NextResponse.json(
      { error: 'At least one dimension must be rated (1–5)' },
      { status: 400 }
    )
  }

  // Validate individual values
  const dims = { prose, plot, characters, pacing, world }
  for (const [key, val] of Object.entries(dims)) {
    if (val != null && (typeof val !== 'number' || val < 1 || val > 5)) {
      return NextResponse.json(
        { error: `${key} must be between 1 and 5` },
        { status: 400 }
      )
    }
  }

  // Check eligibility: 3+ completed chapters
  const { count } = await supabase
    .from('completed_chapters')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in(
      'document_id',
      // Sub-select: published chapter IDs for this story
      (
        await supabase
          .from('documents')
          .select('id')
          .eq('is_published', true)
          .in(
            'project_id',
            (
              await supabase
                .from('published_stories')
                .select('project_id')
                .eq('id', storyId)
                .single()
            ).data?.project_id ? [(
              await supabase
                .from('published_stories')
                .select('project_id')
                .eq('id', storyId)
                .single()
            ).data!.project_id] : []
          )
      ).data?.map((d) => d.id) ?? []
    )

  if ((count ?? 0) < 3) {
    return NextResponse.json(
      { error: 'You must complete at least 3 chapters to rate this story.' },
      { status: 403 }
    )
  }

  // Upsert — insert new or update existing rating
  const { data, error } = await supabase
    .from('ratings')
    .upsert(
      {
        user_id:            user.id,
        published_story_id: storyId,
        prose:      prose      ?? null,
        plot:       plot       ?? null,
        characters: characters ?? null,
        pacing:     pacing     ?? null,
        world:      world      ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,published_story_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rating: data }, { status: 200 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('user_id', user.id)
    .eq('published_story_id', storyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}