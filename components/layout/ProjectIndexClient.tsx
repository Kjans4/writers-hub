// components/layout/ProjectIndexClient.tsx
// Client component for the project index page.
// Shows the empty state with a "Publish Story" or "Manage Publishing" CTA
// depending on whether the project has been published.

'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, Globe, Settings } from 'lucide-react'

interface PublishedStoryInfo {
  id:           string
  slug:         string
  title:        string
  is_published: boolean
}

interface ProjectIndexClientProps {
  slug:           string
  publishedStory: PublishedStoryInfo | null
}

export default function ProjectIndexClient({
  slug,
  publishedStory,
}: ProjectIndexClientProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center max-w-xs">
        <BookOpen size={36} className="text-stone-200 mx-auto mb-4" />

        <p className="font-serif text-xl text-stone-400 mb-1">
          Select a chapter to begin writing
        </p>
        <p className="text-stone-300 text-sm font-['Inter'] mt-1 mb-8">
          Or create your first chapter in the sidebar
        </p>

        {/* Publish / Manage CTA */}
        <div className="border-t border-stone-100 pt-6">
          {!publishedStory ? (
            <button
              onClick={() => router.push(`/publish/${slug}`)}
              className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium rounded-xl font-['Inter'] transition-colors"
            >
              <Globe size={14} />
              Publish Story
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 justify-center mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-600 font-['Inter']">
                  Story is live
                </span>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => router.push(`/story/${publishedStory.slug}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium rounded-lg font-['Inter'] transition-colors"
                >
                  <Globe size={12} />
                  View story
                </button>
                <button
                  onClick={() => router.push(`/publish/${slug}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium rounded-lg font-['Inter'] transition-colors"
                >
                  <Settings size={12} />
                  Manage publishing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}