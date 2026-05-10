// components/editor/extensions/ParagraphKeyExtension.ts
// Assigns a stable UUID to every paragraph node as a `paragraph_key` attribute.
// The key is set on creation and never changes — even if the paragraph moves.
// This is the authoritative identifier for paragraph history (never use index).
// Works by extending the default Paragraph node from StarterKit.

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { v4 as uuidv4 } from 'uuid'

export const ParagraphKeyPluginKey = new PluginKey('paragraphKey')

export const ParagraphKeyExtension = Extension.create({
  name: 'paragraphKey',

  // Add paragraph_key attribute to all paragraph nodes
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          paragraph_key: {
            default: null,
            parseHTML: (el) => el.getAttribute('data-paragraph-key'),
            renderHTML: (attrs) => {
              if (!attrs.paragraph_key) return {}
              return { 'data-paragraph-key': attrs.paragraph_key }
            },
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ParagraphKeyPluginKey,
        appendTransaction(transactions, oldState, newState) {
          // Only run if the document changed
          if (!transactions.some((tr) => tr.docChanged)) return null

          const tr = newState.tr
          let modified = false

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'paragraph') {
              // Assign a UUID if this paragraph doesn't have one yet
              if (!node.attrs.paragraph_key) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  paragraph_key: uuidv4(),
                })
                modified = true
              }
            }
          })

          return modified ? tr : null
        },
      }),
    ]
  },
})