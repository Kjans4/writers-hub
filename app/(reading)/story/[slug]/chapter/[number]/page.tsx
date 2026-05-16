// app/(reading)/story/[slug]/chapter/[number]/page.tsx
// Chapter reading page. Stays a Server Component for data fetching.
// Mounts ReadingHeader directly and renders chapter prose.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ReadingHeader from '@/components/reader/ReadingHeader'

interface ChapterReadPageProps {
  params: Promise<{ slug: string; number: string }>
}

export default async function ChapterReadPage({ params }: ChapterReadPageProps) {
  const supabase = await createClient()
  
  // Resolve params as a Promise for Next.js 15 forward-compatibility (Issue I)
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

  // Update reading progress + resolve auth status for header
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        published_story_id: story.id,
        current_document_id: chapter.id,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,published_story_id' })
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {/* CRITICAL FIX (Issue A): ReadingHeader mounts directly at the top of the return tree.
        Uses chapter.id directly as the documentId constraint.
      */}
      <ReadingHeader
        storyTitle={story.title}
        storySlug={story.slug}
        chapterNumber={position}
        totalChapters={allChapters.length}
        documentId={chapter.id}
        isLoggedIn={!!user}
      />

      {/* Main content wrapper with 'pt-24' to offset the sticky top-0 ReadingHeader 
        and prevent visual content clipping (Issue H).
      */}
      <div className="flex-1 max-w-170 mx-auto px-6 pt-24 pb-12 w-full">

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

        {/* Chapter title header */}
        <div className="mb-10">
          <p className="text-xs text-stone-400 font-['Inter'] uppercase tracking-wider mb-2">
            Chapter {position}
          </p>
          <h1 className="font-serif text-3xl font-bold text-stone-800 leading-snug">
            {chapter.title}
          </h1>
        </div>

        {/* CRITICAL FIX (Issue A): Bypassed non-existent ChapterAnnotationShell wrapper.
          Render prose directly using standard dangerouslySetInnerHTML wrapper.
        */}
        <div 
          className="prose prose-stone lg:prose-lg focus:outline-none dark:prose-invert font-serif text-stone-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: chapter.content ?? '' }}
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
      </div>
    </div>
  )
}