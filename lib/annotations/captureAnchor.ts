// lib/annotations/captureAnchor.ts
// Converts the current browser text selection into a stable anchor object
// that can be stored in the database and later resolved back to a DOM range.
//
// Anchor format:
//   paragraph_key — the data-paragraph-key attribute of the containing <p>
//   start_offset  — char offset from the start of the paragraph's text content
//   end_offset    — char offset from the start of the paragraph's text content
//   selected_text — the actual selected string (for staleness detection)
//
// IMPORTANT: Returns null (not just a UI guard) if the selection spans
// multiple data-paragraph-key elements. This prevents malformed anchors
// from reaching the API even if the UI check is bypassed.
//
// Cross-paragraph highlights are not supported in the prototype.
// See: "What to Skip" in the Chunk 3 spec.

export interface AnnotationAnchor {
  paragraph_key: string
  start_offset: number
  end_offset: number
  selected_text: string
}

/**
 * Walk up the DOM from a node until we find an element with
 * data-paragraph-key, or return null if none exists.
 */
function findParagraphElement(node: Node): HTMLElement | null {
  let current: Node | null = node

  // Walk up to nearest Element if we're in a text node
  while (current && current.nodeType !== Node.ELEMENT_NODE) {
    current = current.parentNode
  }

  let el = current as HTMLElement | null
  while (el) {
    if (el.dataset?.paragraphKey) return el
    el = el.parentElement
  }

  return null
}

/**
 * Compute the character offset of a point (container + offset) relative
 * to the start of a paragraph element's full text content.
 */
function resolveCharOffset(
  paragraphEl: HTMLElement,
  container: Node,
  offset: number
): number {
  const range = document.createRange()
  range.setStart(paragraphEl, 0)
  range.setEnd(container, offset)
  return range.toString().length
}

/**
 * Capture the current window selection as an AnnotationAnchor.
 *
 * Returns null when:
 *   - The selection is collapsed (nothing selected)
 *   - The selection spans multiple data-paragraph-key elements
 *   - No data-paragraph-key ancestor can be found
 *   - The selected text is empty after trimming whitespace
 */
export function captureAnchor(selection: Selection): AnnotationAnchor | null {
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  if (range.collapsed) return null

  const selectedText = range.toString()
  if (!selectedText.trim()) return null

  // Find the paragraph element for the start of the selection
  const startParagraph = findParagraphElement(range.startContainer)
  if (!startParagraph) return null

  // Find the paragraph element for the end of the selection
  const endParagraph = findParagraphElement(range.endContainer)
  if (!endParagraph) return null

  // Cross-paragraph selections are not supported — guard at utility level
  if (startParagraph !== endParagraph) return null

  const paragraphKey = startParagraph.dataset.paragraphKey!

  // Resolve char offsets relative to the paragraph's text content
  const startOffset = resolveCharOffset(
    startParagraph,
    range.startContainer,
    range.startOffset
  )
  const endOffset = resolveCharOffset(
    startParagraph,
    range.endContainer,
    range.endOffset
  )

  if (startOffset >= endOffset) return null

  return {
    paragraph_key: paragraphKey,
    start_offset: startOffset,
    end_offset: endOffset,
    selected_text: selectedText,
  }
}