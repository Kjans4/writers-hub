// components/guide/GuideHeader.tsx
// Sticky top bar shown on all guide pages.
// Shows the Writer's Hub logo + a back link to the guide index.
// Used by both the index page and individual guide pages.

import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'

interface GuideHeaderProps {
  title?: string
  showBack?: boolean
}

export default function GuideHeader({
  title,
  showBack = true,
}: GuideHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Left: back link or logo */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link
              href="/guide"
              className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-['Inter'] transition-colors"
            >
              <ArrowLeft size={14} />
              All guides
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-amber-500" />
              <span className="font-serif text-stone-600 text-sm">
                Writer's Hub
              </span>
            </div>
          )}
        </div>

        {/* Right: page title (optional) */}
        {title && (
          <span className="text-xs text-stone-400 font-['Inter'] hidden sm:block truncate max-w-[200px]">
            {title}
          </span>
        )}

        {/* Right: dashboard link */}
        <Link
          href="/dashboard"
          className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
        >
          Dashboard →
        </Link>
      </div>
    </header>
  )
}