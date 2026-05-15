// lib/annotations/resolveAnchor.ts
// Resolves a stored AnnotationAnchor back to a live DOM Range.
//
// Staleness detection:
//   The stored selected_text is compared against the text currently at
//   [start_offset, end_offset] within the paragraph. If they don't match,
//   the anchor is marked stale — the author likely edited that paragraph
//   after the annotation was saved.
//
// Returns null when:
//   - The paragraph element no longer exists in the DOM (deleted paragraph)
//   - The text nodes can't be walked to the required offsets
//
// Returns { range, isStale } when the paragraph exists but content changed.

import { AnnotationAnchor } from './captureAnchor'

export interface ResolvedAnchor {
  range: Range
  isStale: boolean
}

/**
 * Resolve a stored anchor back to a DOM Range.
 *
 * @param anchor  — the stored anchor object
 * @param container — the root element that contains the rendered chapter HTML
 *                    (the ChapterRenderer's container ref)
 */
export function resolveAnchor(
  anchor: AnnotationAnchor,
  container: HTMLElement
): ResolvedAnchor | null {
  // Find the paragraph element by its stable key
  const el = container.querySelector(
    `[data-paragraph-key="${anchor.paragraph_key}"]`
  ) as HTMLElement | null

  if (!el) return null  // paragraph was deleted — fully stale

  const paragraphText = el.textContent ?? ''

  // Check staleness: does the text at the stored offsets still match?
  const currentSlice = paragraphText.slice(anchor.start_offset, anchor.end_offset)
  const isStale = currentSlice !== anchor.selected_text

  // Build a DOM Range by walking text nodes and counting characters
  const range = document.createRange()
  let startSet = false
  let charCount = 0

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)

  let textNode: Text | null = walker.nextNode() as Text | null

  while (textNode) {
    const len = textNode.length

    // Set range start
    if (!startSet) {
      if (charCount + len >= anchor.start_offset) {
        range.setStart(textNode, anchor.start_offset - charCount)
        startSet = true
      }
    }

    // Set range end (only after start is set)
    if (startSet) {
      if (charCount + len >= anchor.end_offset) {
        range.setEnd(textNode, anchor.end_offset - charCount)
        return { range, isStale }
      }
    }

    charCount += len
    textNode = walker.nextNode() as Text | null
  }

  // If we ran out of text nodes before reaching end_offset, the paragraph
  // was shortened — stale, but we can still return what we have
  if (startSet) {
    // Clamp to end of paragraph
    const lastChild = el.lastChild
    if (lastChild) {
      if (lastChild.nodeType === Node.TEXT_NODE) {
        range.setEnd(lastChild, (lastChild as Text).length)
      } else {
        range.setEndAfter(lastChild)
      }
    }
    return { range, isStale: true }
  }

  return null
}