// lib/hooks/useWordCount.ts
// Derives live word count and estimated reading time from a TipTap editor
// instance. Updates 250ms after the last content change — fast enough to
// feel live without recalculating on every single keystroke.
//
// Word counting strategy:
//   - Walk the ProseMirror document tree collecting text from all text nodes
//   - Split on whitespace, filter empty strings
//   - This correctly handles wikilink atom nodes (they contribute their title
//     text to the count via node.textContent)
//
// Reading time:
//   - 200 wpm — standard pace for fiction (slower than non-fiction's ~250 wpm)
//   - Minimum 1 minute displayed once any words exist
//
// Returns { wordCount, readingTime } where readingTime is minutes (number).
// Both are 0 when the editor is null or empty.

import { useEffect, useState, useRef } from 'react'
import { Editor } from '@tiptap/react'

const WORDS_PER_MINUTE = 200
const DEBOUNCE_MS      = 250

interface WordCountResult {
  wordCount:   number
  readingTime: number  // minutes, minimum 1 once wordCount > 0
}

function countWords(editor: Editor): number {
  // textContent on the whole doc gives us plain text with all nodes flattened
  const text = editor.state.doc.textContent
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function useWordCount(editor: Editor | null): WordCountResult {
  const [wordCount, setWordCount] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!editor) return

    // Capture a local, immutable reference so TypeScript safely tracks 
    // the narrowed 'Editor' type inside the asynchronous timeout closure.
    const stableEditor = editor

    // Compute immediately on mount so the count shows without waiting
    setWordCount(countWords(stableEditor))

    function handleUpdate() {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        setWordCount(countWords(stableEditor))
      }, DEBOUNCE_MS)
    }

    stableEditor.on('update', handleUpdate)

    return () => {
      stableEditor.off('update', handleUpdate)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [editor])

  const readingTime = wordCount === 0
    ? 0
    : Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))

  return { wordCount, readingTime }
}