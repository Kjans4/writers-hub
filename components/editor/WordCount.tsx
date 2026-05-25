// components/editor/WordCount.tsx
// Live word count + reading time display shown in the chapter editor.
// Designed to be completely unobtrusive — sits to the left of the action
// buttons in EditorHeader, fades to near-invisible at idle so it never
// competes with the prose, and brightens on hover for when the writer
// wants to check it deliberately.
//
// Format:
//   "1,234 words · 6 min read"   (wordCount > 0)
//   ""                           (empty document — shows nothing at all)
//
// The comma-formatting on word count (toLocaleString) keeps large numbers
// readable without the display jumping around in width too much.

'use client'

import { Editor } from '@tiptap/react'
import { useWordCount } from '@/lib/hooks/useWordCount'

interface WordCountProps {
  editor: Editor | null
}

export default function WordCount({ editor }: WordCountProps) {
  const { wordCount, readingTime } = useWordCount(editor)

  // Show nothing on an empty document — no "0 words" clutter
  if (wordCount === 0) return null

  return (
    <span
      className="
        text-xs font-['Inter'] text-stone-300
        hover:text-stone-400
        transition-colors duration-200
        select-none
        tabular-nums
        whitespace-nowrap
      "
      title={`${wordCount.toLocaleString()} words · ~${readingTime} min read`}
    >
      {wordCount.toLocaleString()} words
      <span className="mx-1 opacity-50">·</span>
      {readingTime} min read
    </span>
  )
}