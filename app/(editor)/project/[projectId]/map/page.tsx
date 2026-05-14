// app/(editor)/project/[projectId]/map/page.tsx
// Full-screen story map page.

'use client'

import { useParams, useRouter } from 'next/navigation'
import StoryMap from '@/components/map/StoryMap'
import { ArrowLeft } from 'lucide-react'

export default function MapPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  return (
    <div className="relative w-full h-full min-h-screen">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 border border-stone-200 rounded-lg text-stone-500 hover:text-stone-700 text-xs font-['Inter'] shadow-sm transition-colors backdrop-blur-sm"
      >
        <ArrowLeft size={13} />
        Back
      </button>
      <StoryMap projectId={projectId} />
    </div>
  )
}