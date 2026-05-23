// components/guide/GuideRow.tsx
// Small row of guide cards pinned above the genre pills on /home.
// Guide metadata is passed as props (resolved server-side from MDX frontmatter).

import Link from 'next/link'
import GuideCard from './GuideCard'
import { BookOpen } from 'lucide-react'

export interface GuideMeta {
  slug: string
  title: string
  description: string
  order: number
}

interface GuideRowProps {
  guides: GuideMeta[]
}

export default function GuideRow({ guides }: GuideRowProps) {
  if (!guides.length) return null

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <BookOpen size={13} className="text-stone-400" />
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter']">
            How it works
          </span>
        </div>
        <Link
          href="/guide"
          className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
        >
          All guides →
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {guides.map((guide) => (
          <GuideCard key={guide.slug} {...guide} />
        ))}
      </div>
    </section>
  )
}