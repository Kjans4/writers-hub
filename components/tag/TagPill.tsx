// components/tag/TagPill.tsx
// Small clickable tag chip.
// Without onClick → renders as a Link to /tag/[name].
// With onClick → renders as a button (used for filter toggles).

import Link from 'next/link'

interface TagPillProps {
  name:     string
  onClick?: () => void
}

export default function TagPill({ name, onClick }: TagPillProps) {
  const className = `
    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-['Inter']
    text-stone-500 bg-stone-100 hover:bg-stone-200 hover:text-stone-700
    transition-colors
  `

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {name}
      </button>
    )
  }

  return (
    <Link
      href={`/tag/${name}`}
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {name}
    </Link>
  )
}