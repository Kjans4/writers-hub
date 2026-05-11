// components/feed/CoverPlaceholder.tsx
// Renders a deterministic colored placeholder when a story has no cover image.
// Color and initials are derived from the story ID so they're always consistent
// for the same story across sessions and users.

interface CoverPlaceholderProps {
  storyId: string
  title:   string
  className?: string
}

// Five warm, literary-feeling colors — muted enough to look intentional
const COLORS = [
  { bg: '#44403c', text: '#fafaf8' },   // stone dark
  { bg: '#713f12', text: '#fef9ee' },   // amber dark
  { bg: '#1e3a5f', text: '#eff6ff' },   // navy
  { bg: '#3d2b1f', text: '#fdf8f3' },   // warm brown
  { bg: '#1a2e1a', text: '#f0fdf4' },   // forest
]

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function getColor(storyId: string) {
  // Use last char of UUID for deterministic but well-distributed selection
  const hex   = storyId.replace(/-/g, '')
  const index = parseInt(hex.slice(-1), 16) % COLORS.length
  return COLORS[index]
}

export default function CoverPlaceholder({
  storyId,
  title,
  className = '',
}: CoverPlaceholderProps) {
  const color    = getColor(storyId)
  const initials = getInitials(title)

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center ${className}`}
      style={{ backgroundColor: color.bg }}
    >
      <span
        className="font-serif font-bold select-none"
        style={{
          color:    color.text,
          fontSize: 'clamp(1.5rem, 8cqi, 3rem)',
          opacity:  0.9,
        }}
      >
        {initials}
      </span>
      <div
        className="mt-2 w-8 h-px"
        style={{ backgroundColor: color.text, opacity: 0.3 }}
      />
    </div>
  )
}