// components/guide/GuideHeader.tsx
// Simple standalone header for guide pages.
// No login/avatar — just branding and a back link.

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft } from 'lucide-react'

interface GuideHeaderProps {
  title: string
}

export default function GuideHeader({ title }: GuideHeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-['Inter'] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Branding */}
        <Link
          href="/home"
          className="flex items-center gap-1.5 text-stone-600 hover:text-stone-800 transition-colors"
        >
          <BookOpen size={15} className="text-amber-500" />
          <span className="font-serif text-sm text-stone-700">Writer's Hub</span>
        </Link>

        {/* Spacer to balance the back button */}
        <div className="w-16" />
      </div>
    </header>
  )
}