// app/api/tags/suggest/route.ts
// GET /api/tags/suggest?q=slow
// Returns up to 10 matching tags for the writer-side autocomplete.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const q = new URL(req.url).searchParams.get('q') ?? ''

  const query = supabase
    .from('tags')
    .select('name, use_count')
    .order('use_count', { ascending: false })
    .limit(10)

  if (q.trim()) {
    query.ilike('name', `${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ tags: [] })
  return NextResponse.json({ tags: data ?? [] })
}