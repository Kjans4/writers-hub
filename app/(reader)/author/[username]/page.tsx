// app/(reader)/author/[username]/page.tsx
// Public author profile page.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CoverPlaceholder from '@/components/feed/CoverPlaceholder'

interface AuthorPageProps {
  params: { username: string }
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const { data: stories } = await supabase
    .from('published_stories')
    .select('id, slug, title, hook, cover_url, status, published_at')
    .eq('user_id', profile.id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const displayName = profile.display_name ?? profile.username ?? 'Unknown Author'

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Author header */}
        <div className="flex items-start gap-5 mb-12">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border border-stone-200 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 flex-shrink-0">
              <span className="font-serif text-2xl text-stone-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div>
            <h1 className="font-serif text-2xl text-stone-800 mb-0.5">
              {displayName}
            </h1>
            <p className="text-sm text-stone-400 font-['Inter'] mb-2">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-sm text-stone-500 font-['Inter'] leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stories */}
        <div>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-4">
            Stories — {stories?.length ?? 0}
          </h2>

          {!stories?.length ? (
            <p className="text-sm text-stone-400 font-['Inter']">
              No published stories yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/story/${story.slug}`}
                  className="group flex flex-col"
                >
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
                  </div>
                  <p className="text-sm font-semibold text-stone-800 font-['Inter'] leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {story.title}
                  </p>
                  {story.hook && (
                    <p className="text-xs text-stone-400 font-['Inter'] mt-0.5 line-clamp-2">
                      {story.hook}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}