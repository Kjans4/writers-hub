// app/(reader)/home/page.tsx
// Phase A update: genre pill row + ?genre filter.

import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import StoryCard from '@/components/feed/StoryCard'
import GenrePillRow from '@/components/genre/GenrePillRow'
import { Genre } from '@/lib/supabase/types'

interface HomePageProps {
  searchParams: { genre?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase       = await createClient()
  const activeGenreSlug = searchParams.genre ?? ''

  // All genres for pill row
  const { data: genres } = await supabase
    .from('genres')
    .select('*')
    .order('sort_order', { ascending: true })

  // Resolve active genre ID from slug
  let activeGenreId: string | null = null
  if (activeGenreSlug) {
    const match = (genres ?? []).find((g: Genre) => g.slug === activeGenreSlug)
    activeGenreId = match?.id ?? null
  }

  // Fetch stories — filtered by genre if active
  let storiesQuery = supabase
    .from('published_stories')
    .select(`
      id, slug, title, hook, cover_url, status,
      profiles ( display_name, username ),
      genres   ( name, slug, color )
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  if (activeGenreId) storiesQuery = storiesQuery.eq('genre_id', activeGenreId)

  const { data: stories } = await storiesQuery

  // Attach tag names
  const storyIds = (stories ?? []).map((s: any) => s.id)
  const tagsByStory: Record<string, string[]> = {}

  if (storyIds.length > 0) {
    const { data: storyTagData } = await supabase
      .from('story_tags')
      .select('published_story_id, tags ( name )')
      .in('published_story_id', storyIds)

    for (const row of storyTagData ?? []) {
      const r     = row as any
      const sid   = r.published_story_id
      const tname = Array.isArray(r.tags) ? r.tags[0]?.name : r.tags?.name
      if (!tname) continue
      if (!tagsByStory[sid]) tagsByStory[sid] = []
      tagsByStory[sid].push(tname)
    }
  }

  const enriched = (stories ?? []).map((s: any) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    const genre   = Array.isArray(s.genres)   ? s.genres[0]   : s.genres
    return {
      id:              s.id,
      slug:            s.slug,
      title:           s.title,
      hook:            s.hook,
      cover_url:       s.cover_url,
      status:          s.status,
      genre_name:      genre?.name  ?? null,
      genre_slug:      genre?.slug  ?? null,
      genre_color:     genre?.color ?? null,
      tag_names:       tagsByStory[s.id] ?? [],
      author_name:     profile?.display_name ?? profile?.username ?? null,
      author_username: profile?.username ?? null,
    }
  })

  const activeGenreName = activeGenreSlug
    ? (genres ?? []).find((g: Genre) => g.slug === activeGenreSlug)?.name ?? 'Stories'
    : 'Stories'

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      {/* Genre pill row — Suspense required because GenrePillRow uses useSearchParams */}
      <div className="mb-8">
        <Suspense fallback={null}>
          <GenrePillRow genres={(genres ?? []) as Genre[]} />
        </Suspense>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-stone-800 mb-1">{activeGenreName}</h1>
        <p className="text-stone-400 text-sm font-['Inter']">
          {enriched.length === 0
            ? 'No stories published yet'
            : `${enriched.length} ${enriched.length === 1 ? 'story' : 'stories'}`}
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <BookOpen size={36} className="text-stone-200 mb-4" />
          <p className="text-stone-400 font-['Inter'] text-sm text-center">
            No stories here yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {enriched.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </main>
  )
}