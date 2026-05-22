// app/(reading)/story/[slug]/chapter/[number]/page.tsx
// Phase E update: mounts TipSection below chapter navigation.
// Also fetches author display name for the tip section.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ReadingHeader from '@/components/reader/ReadingHeader'
import ChapterAnnotationShell from '@/components/reader/ChapterAnnotationShell'
import RatingPrompt from '@/components/rating/RatingPrompt'
import TipSection from '@/components/ink/TipSection'

interface ChapterReadPageProps {
  params: Promise<{ slug: string; number: string }>
}

export default async function ChapterReadPage({ params }: ChapterReadPageProps) {
  const supabase = await createClient()

  const resolvedParams = await params
  const position = parseInt(resolvedParams.number, 10)
  if (isNaN(position) || position < 1) notFound()

  // Fetch story
  const { data: story } = await supabase
    .from('published_stories')
    .select('id, title, slug, project_id, user_id')
    .eq('slug', resolvedParams.slug)
    .eq('is_published', true)
    .single()

  if (!story) notFound()

  // Get Canon branch
  const { data: canonBranch } = await supabase
    .from('branches')
    .select('id')
    .eq('project_id', story.project_id)
    .eq('is_canon', true)
    .single()

  if (!canonBranch) notFound()

  // Get all published chapters in order
  const { data: allChapters } = await supabase
    .from('documents')
    .select('id, title, order_index, content, is_published')
    .eq('project_id', story.project_id)
    .eq('branch_id', canonBranch.id)
    .eq('type', 'chapter')
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  if (!allChapters || allChapters.length === 0) notFound()

  const chapter = allChapters[position - 1]
  if (!chapter) notFound()

  const prevPosition = position > 1 ? position - 1 : null
  const nextPosition = position < allChapters.length ? position + 1 : null

  // Fetch author display name for TipSection
  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('id', story.user_id)
    .single()

  const authorName =
    authorProfile?.display_name ??
    authorProfile?.username ??
    'the author'

  // Auth + reading progress + ratings data
  const { data: { user } } = await supabase.auth.getUser()

  let completedCount = 0
  let existingRating = null

  if (user) {
    // Upsert reading progress
    await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id:             user.id,
          published_story_id:  story.id,
          current_document_id: chapter.id,
          last_read_at:        new Date().toISOString(),
        },
        { onConflict: 'user_id,published_story_id' }
      )

    // Mark chapter completed
    await supabase
      .from('completed_chapters')
      .upsert(
        { user_id: user.id, document_id: chapter.id },
        { onConflict: 'user_id,document_id', ignoreDuplicates: true }
      )

    // Count completed chapters for this story
    const publishedIds = allChapters.map((c) => c.id)
    const { count } = await supabase
      .from('completed_chapters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('document_id', publishedIds)

    completedCount = count ?? 0

    // Fetch existing rating for RatingPrompt
    if (completedCount >= 3) {
      const { data: ratingRow } = await supabase
        .from('ratings')
        .select('prose, plot, characters, pacing, world, dismissed_count')
        .eq('user_id', user.id)
        .eq('published_story_id', story.id)
        .maybeSingle()

      existingRating = ratingRow ?? null
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <ReadingHeader
        storyTitle={story.title}
        storySlug={story.slug}
        chapterNumber={position}
        totalChapters={allChapters.length}
        documentId={chapter.id}
        isLoggedIn={!!user}
      />

      <div className="flex-1 max-w-[680px] mx-auto px-6 pt-24 pb-12 w-full">

        {/* Back to story */}
        <div className="mb-8">
          <Link
            href={`/story/${story.slug}`}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-['Inter'] transition-colors"
          >
            <ArrowLeft size={14} />
            {story.title}
          </Link>
        </div>

        {/* Chapter title */}
        <div className="mb-10">
          <p className="text-xs text-stone-400 font-['Inter'] uppercase tracking-wider mb-2">
            Chapter {position}
          </p>
          <h1 className="font-serif text-3xl font-bold text-stone-800 leading-snug">
            {chapter.title}
          </h1>
        </div>

        {/* Chapter prose + annotation layers */}
        <ChapterAnnotationShell
          documentId={chapter.id}
          isLoggedIn={!!user}
          chapterHtml={chapter.content ?? ''}
        />

        {/* Chapter navigation */}
        <div className="flex items-center justify-between mt-16 pt-8 border-t border-stone-200">
          {prevPosition ? (
            <Link
              href={`/story/${story.slug}/chapter/${prevPosition}`}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors"
            >
              <ArrowLeft size={14} />
              Chapter {prevPosition}
            </Link>
          ) : (
            <div />
          )}

          {nextPosition ? (
            <Link
              href={`/story/${story.slug}/chapter/${nextPosition}`}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors"
            >
              Chapter {nextPosition}
              <ArrowRight size={14} />
            </Link>
          ) : (
            <div className="text-sm text-stone-400 font-['Inter'] italic">
              End of published chapters
            </div>
          )}
        </div>

        {/* Phase E — Tip section (below nav, above rating) */}
        <TipSection
          storyId={story.id}
          documentId={chapter.id}
          authorName={authorName}
          isLoggedIn={!!user}
        />

        {/* Phase D — Rating prompt */}
        {user && (
          <RatingPrompt
            storyId={story.id}
            completedCount={completedCount}
            existingRating={existingRating}
          />
        )}

      </div>
    </div>
  )
}