// app/(reader)/home/page.tsx
// Home feed page.
// Phase A stub: shows recently published stories in a simple grid.
// Will be replaced with the full HomeFeed component in Phase B.

import { createClient } from '@/lib/supabase/server'
import { BookOpen } from 'lucide-react'
import CoverPlaceholder from '@/components/feed/CoverPlaceholder'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: stories } = await supabase
    .from('published_stories')
    .select(`
      id, slug, title, hook, cover_url, status, content_rating,
      published_at, user_id,
      profiles ( display_name, username )
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      <div className="mb-8">
        <h1 className="font-serif text-2xl text-stone-800 mb-1">
          Stories
        </h1>
        <p className="text-stone-400 text-sm font-['Inter']">
          {stories?.length
            ? `${stories.length} published ${stories.length === 1 ? 'story' : 'stories'}`
            : 'No stories published yet'}
        </p>
      </div>

      {!stories?.length ? (
        <div className="flex flex-col items-center justify-center py-24">
          <BookOpen size={36} className="text-stone-200 mb-4" />
          <p className="text-stone-400 font-['Inter'] text-sm text-center">
            No stories have been published yet.
            <br />
            Be the first — open a project and hit Publish.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {stories.map((story) => {
            // Supabase returns joined relations as an array — take the first row
            const profilesRaw = story.profiles as unknown as { display_name: string | null; username: string | null }[] | null
            const author = Array.isArray(profilesRaw) ? profilesRaw[0] ?? null : null
            const authorName = author?.display_name ?? author?.username ?? 'Unknown'

            return (
              <Link
                key={story.id}
                href={`/story/${story.slug}`}
                className="group flex flex-col"
              >
                {/* Cover */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-sm border border-stone-100 group-hover:shadow-md transition-shadow">
                  {story.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={story.cover_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CoverPlaceholder storyId={story.id} title={story.title} />
                  )}

                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {story.status === 'completed' && (
                      <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-['Inter']">
                        Complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <p className="text-sm font-semibold text-stone-800 font-['Inter'] leading-snug line-clamp-2 mb-0.5 group-hover:text-amber-700 transition-colors">
                  {story.title}
                </p>
                <p className="text-xs text-stone-400 font-['Inter']">
                  {authorName}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}