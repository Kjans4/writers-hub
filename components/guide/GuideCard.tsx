// components/guide/GuideCard.tsx
// Card shown on the guide index page for each guide.
// Displays title, description, and links to the guide's slug page.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GuideMeta } from '@/lib/guides'

export default function GuideCard({
  slug,
  title,
  description,
}: GuideMeta) {
  return (
    <Link
      href={`/guide/${slug}`}
      className="group block bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-base text-stone-800 leading-snug mb-1 group-hover:text-amber-700 transition-colors">
            {title}
          </h2>
          <p className="text-sm text-stone-400 font-['Inter'] leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
        <ArrowRight
          size={15}
          className="text-stone-300 group-hover:text-amber-500 flex-shrink-0 mt-1 transition-colors"
        />
      </div>
    </Link>
  )
}