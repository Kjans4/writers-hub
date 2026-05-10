// components/editor/extensions/WikilinkExtension.ts

import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
// ── ADDED IMPORTS ──────────────────────────────────────────
import { ReactNodeViewRenderer } from '@tiptap/react'
import WikilinkNodeView from '../WikilinkNodeView'

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
  atom: true,

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

  // ── MODIFIED: RENDER VIA REACT COMPONENT ──────────────────
  addNodeView() {
    return ReactNodeViewRenderer(WikilinkNodeView)
  },

  // We still keep renderHTML for copy-pasting/exporting to plain HTML
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

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[$/,
        handler: ({ state, range, commands }) => {
          commands.deleteRange(range)

          const event = new CustomEvent('wikilink:search', {
            detail: { query: '' },
            bubbles: true,
          })
          document.dispatchEvent(event)
        },
      }),
    ]
  },

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