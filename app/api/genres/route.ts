// app/api/genres/route.ts
// GET /api/genres
// Returns all genres ordered by sort_order.
// Used by dropdowns and the home page pill row.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ genres: data })
}