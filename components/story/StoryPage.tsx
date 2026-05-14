// components/story/StoryPage.tsx
// Phase A update: adds GenreBadge and full TagList to the story header.

'use client'

import { useRouter } from 'next/navigation'
import { PublishedStory, Profile, ContentRating, StoryStatus } from '@/lib/supabase/types'
import CoverPlaceholder from '@/components/feed/CoverPlaceholder'
import GenreBadge from '@/components/genre/GenreBadge'
import TagList from '@/components/tag/TagList'
import { ArrowLeft, Lock } from 'lucide-react'

interface PublishedChapter {
  document_id:  string
  position:     number
  title:        string
  published_at: string
}

interface StoryPageProps {
  story:          PublishedStory
  chapters:       PublishedChapter[]
  draftCount:     number
  author:         Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'bio'> | null
  resumePosition: number | null
  isLoggedIn:     boolean
  genreName:      string | null   // Phase A
  genreSlug:      string | null   // Phase A
  genreColor:     string | null   // Phase A
  tags:           string[]        // Phase A
}

const RATING_LABELS: Record<ContentRating, string> = {
  all_ages: 'All Ages',
  teen:     'Teen',
  mature:   'Mature',
}

const STATUS_LABELS: Record<StoryStatus, string> = {
  ongoing:   'Ongoing',
  completed: 'Completed',
  hiatus:    'Hiatus',
}

const STATUS_COLORS: Record<StoryStatus, string> = {
  ongoing:   'text-emerald-600 bg-emerald-50',
  completed: 'text-violet-600 bg-violet-50',
  hiatus:    'text-amber-600 bg-amber-50',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function StoryPage({
  story, chapters, draftCount, author, resumePosition, isLoggedIn,
  genreName, genreSlug, genreColor, tags,
}: StoryPageProps) {
  const router = useRouter()

  const ctaPosition = resumePosition ?? 1
  const ctaLabel    = resumePosition
    ? `Continue Reading — Chapter ${resumePosition}`
    : 'Start Reading →'

  const authorName = author?.display_name ?? author?.username ?? 'Unknown Author'
  const authorHref = author?.username ? `/author/${author.username}` : null

  return (
    <div className="min-h-screen bg-[#faf9f7]">

      <div className="max-w-3xl mx-auto px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-['Inter'] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Story header */}
        <div className="flex gap-8 mb-10">

          {/* Cover */}
          <div className="flex-shrink-0">
            {story.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={story.cover_url}
                alt={`${story.title} cover`}
                className="w-36 h-52 object-cover rounded-xl shadow-md border border-stone-100"
              />
            ) : (
              <div className="w-36 h-52 rounded-xl shadow-md overflow-hidden">
                <CoverPlaceholder storyId={story.id} title={story.title} />
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="font-serif text-2xl font-bold text-stone-800 leading-snug mb-1">
              {story.title}
            </h1>

            <p className="text-sm text-stone-500 font-['Inter'] mb-3">
              by{' '}
              {authorHref ? (
                <button
                  onClick={() => router.push(authorHref)}
                  className="text-stone-700 hover:text-amber-700 underline underline-offset-2 transition-colors"
                >
                  {authorName}
                </button>
              ) : (
                <span className="text-stone-700">{authorName}</span>
              )}
            </p>

            {story.hook && (
              <p className="font-serif text-base text-stone-600 italic leading-relaxed mb-4">
                "{story.hook}"
              </p>
            )}

            {/* Rating + status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full font-['Inter']">
                {RATING_LABELS[story.content_rating]}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-['Inter'] ${STATUS_COLORS[story.status]}`}>
                {STATUS_LABELS[story.status]}
              </span>
              <span className="text-xs text-stone-400 font-['Inter']">
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
                {draftCount > 0 && ` · ${draftCount} coming`}
              </span>
            </div>

            {/* Genre badge */}
            {genreName && genreSlug && genreColor && (
              <div className="mb-2">
                <GenreBadge name={genreName} slug={genreSlug} color={genreColor} size="sm" />
              </div>
            )}

            {/* All tags */}
            {tags.length > 0 && <TagList tags={tags} />}
          </div>
        </div>

        {/* Description */}
        {story.description && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
              About This Story
            </h2>
            <div className="w-full h-px bg-stone-200 mb-4" />
            <p className="font-['Inter'] text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
              {story.description}
            </p>
          </section>
        )}

        {/* Chapter list */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
            Chapters
          </h2>
          <div className="w-full h-px bg-stone-200 mb-4" />

          {chapters.length === 0 ? (
            <p className="text-sm text-stone-400 font-['Inter']">No chapters published yet.</p>
          ) : (
            <div className="space-y-1">
              {chapters.map((ch) => (
                <button
                  key={ch.document_id}
                  onClick={() => router.push(`/story/${story.slug}/chapter/${ch.position}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-stone-100 transition-colors group text-left"
                >
                  <span className="text-sm text-stone-300 font-['Inter'] w-6 flex-shrink-0 text-right">
                    {ch.position}
                  </span>
                  <span className="flex-1 text-sm text-stone-700 font-['Inter'] group-hover:text-stone-900 transition-colors truncate">
                    {ch.title}
                  </span>
                  <span className="text-xs text-stone-300 font-['Inter'] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDate(ch.published_at)}
                  </span>
                </button>
              ))}

              {draftCount > 0 && (
                <div className="flex items-center gap-4 px-4 py-3 opacity-40 select-none">
                  <Lock size={12} className="text-stone-400 ml-1 flex-shrink-0" />
                  <span className="text-sm text-stone-400 font-['Inter'] italic">
                    {draftCount} more chapter{draftCount !== 1 ? 's' : ''} coming soon
                  </span>
                </div>
              )}
            </div>
          )}

          {chapters.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => router.push(`/story/${story.slug}/chapter/${ctaPosition}`)}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-xl font-['Inter'] transition-colors"
              >
                {ctaLabel}
              </button>
            </div>
          )}
        </section>

        {/* Author */}
        {author && (
          <section>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
              About the Author
            </h2>
            <div className="w-full h-px bg-stone-200 mb-4" />
            <div className="flex items-start gap-4">
              {author.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={author.avatar_url}
                  alt={authorName}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-stone-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 border border-stone-200">
                  <span className="text-stone-400 font-serif text-lg">
                    {authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 font-['Inter']">{authorName}</p>
                {author.username && (
                  <p className="text-xs text-stone-400 font-['Inter'] mb-2">@{author.username}</p>
                )}
                {author.bio && (
                  <p className="text-sm text-stone-500 font-['Inter'] leading-relaxed">{author.bio}</p>
                )}
                {authorHref && (
                  <button
                    onClick={() => router.push(authorHref)}
                    className="mt-3 text-xs text-amber-600 hover:text-amber-800 font-['Inter'] underline underline-offset-2 transition-colors"
                  >
                    View all stories by {authorName}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}