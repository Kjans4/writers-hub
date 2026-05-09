// app/(app)/project/[projectId]/page.tsx
// Project index page — shown when no chapter is selected.
// Displays a welcome/empty state with a prompt to create the first chapter.
// Will be replaced by the editor in Phase 2 once a chapter is opened.

'use client'

import { useParams, useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export default function ProjectIndexPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <BookOpen size={36} className="text-stone-200 mx-auto mb-4" />
        <p className="font-serif text-xl text-stone-400">
          Select a chapter to begin writing
        </p>
        <p className="text-stone-300 text-sm font-['Inter'] mt-1">
          Or create your first chapter in the sidebar
        </p>
      </div>
    </div>
  )
}