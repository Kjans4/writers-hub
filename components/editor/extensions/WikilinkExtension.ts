// components/editor/extensions/WikilinkExtension.ts
// Custom TipTap node extension for [[wikilinks]].
// - Triggers on typing "[["
// - Renders as an inline node with amber underline styling
// - Stores the linked entity title as a node attribute
// - Fires a custom DOM event "wikilink:search" to open the dropdown
// - Fires "wikilink:update" after every editor update with all current wikilink titles
//   (used by useLinks to sync the links table)

import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const WikilinkPluginKey = new PluginKey('wikilink')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikilink: {
      insertWikilink: (title: string) => ReturnType
    }
  }
}

export const WikilinkExtension = Node.create({
  name: 'wikilink',
  group: 'inline',
  inline: true,
  atom: true, // treated as a single unit — can't be partially selected

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title'),
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wikilink]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wikilink': '',
        class: 'wikilink',
      }),
      `[[${HTMLAttributes['data-title']}]]`,
    ]
  },

  addCommands() {
    return {
      insertWikilink:
        (title: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { title },
          })
        },
    }
  },

  // Trigger: typing [[ opens the search dropdown
  addInputRules() {
    return [
      new InputRule({
        find: /\[\[$/,
        handler: ({ state, range, commands }) => {
          // Delete the "[["
          commands.deleteRange(range)

          // Fire event to open dropdown at cursor position
          const event = new CustomEvent('wikilink:search', {
            detail: { query: '' },
            bubbles: true,
          })
          document.dispatchEvent(event)
        },
      }),
    ]
  },

  // After every update, collect all wikilink titles and fire wikilink:update
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: WikilinkPluginKey,
        view() {
          return {
            update(view) {
              const titles: string[] = []
              view.state.doc.descendants((node) => {
                if (node.type.name === 'wikilink') {
                  titles.push(node.attrs.title)
                }
              })
              const event = new CustomEvent('wikilink:update', {
                detail: { titles },
                bubbles: true,
              })
              document.dispatchEvent(event)
            },
          }
        },
      }),
    ]
  },
})