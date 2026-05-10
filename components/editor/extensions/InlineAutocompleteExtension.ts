// components/editor/extensions/InlineAutocompleteExtension.ts
// ProseMirror plugin that drives inline entity autocomplete.
//
// Responsibilities:
//   1. Watch every editor transaction for text changes
//   2. Extract the current word being typed (walking back from cursor)
//   3. If word ≥ 3 chars AND cursor is inside a paragraph node:
//        → query Supabase for matching entities
//        → fire "autocomplete:suggest" with matches + cursor rect
//   4. If word < 3 chars, node is not a paragraph, or Escape was pressed:
//        → fire "autocomplete:clear"
//
// Does NOT render any UI — that is InlineAutocomplete.tsx's job.
// Does NOT handle Tab — that is InlineAutocomplete.tsx's job.
// Uses a 120ms debounce to avoid querying on every single keystroke.

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { createClient } from '@/lib/supabase/client'
import { Document } from '@/lib/supabase/types'

export const InlineAutocompleteKey = new PluginKey('inlineAutocomplete')

// Shape of the event payload fired on "autocomplete:suggest"
export interface AutocompleteSuggestDetail {
  query: string           // the partial word typed, e.g. "Joh"
  matches: Document[]     // entities whose title starts with query
  cursorRect: DOMRect     // bounding rect of cursor for positioning UI
  wordStart: number       // ProseMirror pos where the current word starts
}

interface InlineAutocompleteOptions {
  projectId: string
  branchId: string
}

export const InlineAutocompleteExtension = Extension.create<InlineAutocompleteOptions>({
  name: 'inlineAutocomplete',

  addOptions() {
    return {
      projectId: '',
      branchId: '',
    }
  },

  addProseMirrorPlugins() {
    const { projectId, branchId } = this.options
    const supabase = createClient()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let lastQuery = ''         // track last query to avoid redundant fetches
    let dismissed = false      // set true on Escape, cleared on next word change

    return [
      new Plugin({
        key: InlineAutocompleteKey,

        props: {
          // Intercept keyboard events at the ProseMirror level
          handleKeyDown(view, event) {
            // Escape: set dismissed flag and clear suggestion
            if (event.key === 'Escape') {
              dismissed = true
              document.dispatchEvent(
                new CustomEvent('autocomplete:clear', { bubbles: true })
              )
              return false   // don't prevent default — let Escape do other things too
            }
            return false
          },
        },

        // Watch every transaction (typing, paste, cursor moves)
        view() {
          return {
            update(view) {
              const { state } = view
              const { from, to } = state.selection

              // Only fire on collapsed cursor (no selection)
              if (from !== to) {
                document.dispatchEvent(
                  new CustomEvent('autocomplete:clear', { bubbles: true })
                )
                return
              }

              // Confirm cursor is inside a paragraph node
              const $pos = state.doc.resolve(from)
              const parentNode = $pos.parent
              if (parentNode.type.name !== 'paragraph') {
                document.dispatchEvent(
                  new CustomEvent('autocomplete:clear', { bubbles: true })
                )
                return
              }

              // Extract current word: walk back from cursor through the
              // current text node to find the word boundary
              const textBefore = $pos.parent.textBetween(
                0,
                $pos.parentOffset,
                undefined,
                '\0'
              )

              // Match the last "word" — letters, apostrophes, hyphens
              // Stops at spaces, punctuation, and the [[ trigger
              const wordMatch = textBefore.match(/[\w'-]+$/)
              const currentWord = wordMatch ? wordMatch[0] : ''
              const wordStart = from - currentWord.length

              // If word changed, reset dismissed flag so a new suggestion
              // can appear even if the writer dismissed the previous one
              if (currentWord !== lastQuery) {
                dismissed = false
              }

              // Below minimum length — clear and stop
              if (currentWord.length < 3 || dismissed) {
                if (lastQuery.length >= 3) {
                  // Only fire clear if we were previously showing something
                  document.dispatchEvent(
                    new CustomEvent('autocomplete:clear', { bubbles: true })
                  )
                }
                lastQuery = currentWord
                return
              }

              lastQuery = currentWord

              // Debounce the Supabase query — 120ms is fast enough to feel
              // instant but prevents a fetch on every single character
              if (debounceTimer) clearTimeout(debounceTimer)
              debounceTimer = setTimeout(async () => {
                if (!projectId || !branchId) return

                const { data, error } = await supabase
                  .from('documents')
                  .select('id, title, type, project_id, branch_id, content, metadata, order_index, created_at, updated_at')
                  .eq('project_id', projectId)
                  .eq('branch_id', branchId)
                  .neq('type', 'chapter')
                  .ilike('title', `${currentWord}%`)
                  .order('title', { ascending: true })
                  .limit(8)

                if (error || !data || data.length === 0) {
                  document.dispatchEvent(
                    new CustomEvent('autocomplete:clear', { bubbles: true })
                  )
                  return
                }

                // Get cursor DOM position for UI placement
                const cursorCoords = view.coordsAtPos(from)
                const cursorRect = new DOMRect(
                  cursorCoords.left,
                  cursorCoords.top,
                  0,
                  cursorCoords.bottom - cursorCoords.top
                )

                const detail: AutocompleteSuggestDetail = {
                  query: currentWord,
                  matches: data as Document[],
                  cursorRect,
                  wordStart,
                }

                document.dispatchEvent(
                  new CustomEvent('autocomplete:suggest', {
                    detail,
                    bubbles: true,
                  })
                )
              }, 120)
            },
          }
        },
      }),
    ]
  },
})