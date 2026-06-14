// app/(reading)/story/[slug]/chapter/[number]/page.tsx
// Chapter reading page — lives in the (reading) route group so that
// ReaderNav is suppressed and ReadingHeader owns the top of the screen.
//
// Previously lived at app/(reader)/story/[slug]/chapter/[number]/page.tsx.
// Move the file; delete the old location.
//
// Changes from the old version:
//   1. Imports and renders ReadingHeader (sticky, replaces ReaderNav here)
//   2. Imports and renders ChapterAnnotationShell (wraps chapter content)
//   3. Resolves totalChapters so ReadingHeader can show "Ch N of M"

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ReadingHeader from '@/components/reader/ReadingHeader'
import ChapterAnnotationShell from '@/components/reader/ChapterAnnotationShell'

interface ChapterReadPageProps {
  params: Promise<{ slug: string; number: string }>
}

export default async function ChapterReadPage({ params }: ChapterReadPageProps) {
  // Fix I — await params (required in Next.js 14.2+ App Router)
  const { slug, number } = await params

  const supabase = await createClient()
  const position = parseInt(number, 10)
  if (isNaN(position) || position < 1) notFound()

  // Fetch story
  const { data: story } = await supabase
    .from('published_stories')
    .select('id, title, slug, project_id, user_id')
    .eq('slug', slug)
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
  const totalChapters = allChapters.length

  // Update reading progress if logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
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
  }

  return (
    <>
      {/* ReadingHeader — sticky top bar, replaces ReaderNav for this route */}
      <ReadingHeader
        storyTitle={story.title}
        storySlug={story.slug}
        chapterNumber={position}
        totalChapters={totalChapters}
        documentId={chapter.id}
        isLoggedIn={!!user}
      />

      <div className="max-w-[680px] mx-auto px-6 py-12">

        {/* Chapter header */}
        <div className="mb-10">
          <p className="text-xs text-stone-400 font-['Inter'] uppercase tracking-wider mb-2">
            Chapter {position}
          </p>
          <h1 className="font-serif text-3xl font-bold text-stone-800 leading-snug">
            {chapter.title}
          </h1>
        </div>

        {/* Chapter content — wrapped in annotation shell */}
        <ChapterAnnotationShell
          documentId={chapter.id}
          storySlug={story.slug}
          chapterNumber={position}
          isLoggedIn={!!user}
        >
          <div
            className="editor-content"
            dangerouslySetInnerHTML={{ __html: chapter.content ?? '' }}
          />
        </ChapterAnnotationShell>

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
      </div>
    </>
  )
}