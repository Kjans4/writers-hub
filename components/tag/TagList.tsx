// components/tag/TagList.tsx
// Reader-side row of TagPills.
// max prop limits display count (story cards use max=3, story page shows all).

import TagPill from './TagPill'

interface TagListProps {
  tags: string[]
  max?: number
}

export default function TagList({ tags, max }: TagListProps) {
  const visible = max ? tags.slice(0, max) : tags
  if (visible.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag) => (
        <TagPill key={tag} name={tag} />
      ))}
    </div>
  )
}