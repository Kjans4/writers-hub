// components/genre/GenreBadge.tsx
// Colored genre badge — reused on story cards, story page, genre pages.
// Links to /genre/[slug].

import Link from 'next/link'

interface GenreBadgeProps {
  name:  string
  slug:  string
  color: string
  size?: 'xs' | 'sm'
}

export default function GenreBadge({ name, slug, color, size = 'xs' }: GenreBadgeProps) {
  return (
    <Link
      href={`/genre/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className={`
        inline-flex items-center gap-1 rounded-full font-['Inter'] font-medium
        transition-opacity hover:opacity-80
        ${size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'}
      `}
      style={{
        backgroundColor: color + '18',
        color:           color,
        border:          `1px solid ${color}30`,
      }}
    >
      ✦ {name}
    </Link>
  )
}