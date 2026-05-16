// components/reader/MarginBubble.tsx
// A single ●N bubble shown in the right margin next to a paragraph
// that has inline comments.
//
// Clicking opens the MarginDrawer for that paragraph.
// has_mine=true adds a subtle amber ring to indicate the reader
// has already left a reaction here.

'use client'

interface MarginBubbleProps {
  count:      number
  has_mine:   boolean
  top:        number      // px from top of the relative container
  onClick:    () => void
}

export default function MarginBubble({
  count,
  has_mine,
  top,
  onClick,
}: MarginBubbleProps) {
  return (
    <button
      onClick={onClick}
      style={{ top }}
      className={`
        absolute right-0 flex items-center justify-center
        w-7 h-7 rounded-full text-xs font-semibold
        font-['Inter'] transition-all select-none
        shadow-sm z-10
        ${has_mine
          ? 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
          : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'}
      `}
      title={`${count} reaction${count !== 1 ? 's' : ''}${has_mine ? ' — including yours' : ''}`}
      aria-label={`${count} reader reaction${count !== 1 ? 's' : ''} on this passage`}
    >
      {count > 9 ? '9+' : count}
    </button>
  )
}