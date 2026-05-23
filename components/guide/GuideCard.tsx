// components/guide/GuideCard.tsx
// Small card linking to a guide page. Used in GuideRow on /home
// and on the /guide index page.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface GuideCardProps {
  slug: string
  title: string
  description: string
  order: number
}

const ORDER_LABELS: Record<number, string> = {
  1: 'Start here',
  2: 'Editor',
  3: 'World-building',
}

const ORDER_COLORS: Record<number, string> = {
  1: 'text-amber-600 bg-amber-50 border-amber-200',
  2: 'text-violet-600 bg-violet-50 border-violet-200',
  3: 'text-emerald-600 bg-emerald-50 border-emerald-200',
}

export default function GuideCard({ slug, title, description, order }: GuideCardProps) {
  return (
    <Link
      href={`/guide/${slug}`}
      className="group flex flex-col gap-2 p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:shadow-sm transition-all"
    >
      {/* Label */}
      <span
        className={`self-start text-xs font-medium font-['Inter'] px-2 py-0.5 rounded-full border ${ORDER_COLORS[order] ?? 'text-stone-500 bg-stone-50 border-stone-200'}`}
      >
        {ORDER_LABELS[order] ?? `Guide ${order}`}
      </span>

      {/* Title */}
      <p className="font-serif text-base font-semibold text-stone-800 leading-snug group-hover:text-amber-700 transition-colors">
        {title}
      </p>

      {/* Description */}
      <p className="text-xs text-stone-400 font-['Inter'] leading-relaxed line-clamp-2 flex-1">
        {description}
      </p>

      {/* Read link */}
      <div className="flex items-center gap-1 text-xs text-stone-400 group-hover:text-amber-600 font-['Inter'] transition-colors mt-1">
        Read guide
        <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}