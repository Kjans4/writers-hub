// components/editor/extensions/HoverCardExtension.ts
// TipTap plugin that listens for mouseenter/mouseleave on wikilink nodes.
// Fires custom DOM events "wikilink:hover" and "wikilink:hoverout"
// so the HoverCard component can show/hide without coupling to TipTap internals.
// The 400ms delay before showing is handled in the HoverCard component.

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const HoverCardPluginKey = new PluginKey('hovercard')

export const HoverCardExtension = Extension.create({
  name: 'hovercard',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: HoverCardPluginKey,
        props: {
          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement
              const wikilink = target.closest('[data-wikilink]') as HTMLElement | null
              if (!wikilink) return false

              const title = wikilink.getAttribute('data-title')
              if (!title) return false

              const rect = wikilink.getBoundingClientRect()

              document.dispatchEvent(
                new CustomEvent('wikilink:hover', {
                  detail: { title, rect },
                  bubbles: true,
                })
              )

              return false
            },
            mouseout(view, event) {
              const target = event.target as HTMLElement
              const wikilink = target.closest('[data-wikilink]')
              if (!wikilink) return false

              document.dispatchEvent(
                new CustomEvent('wikilink:hoverout', { bubbles: true })
              )

              return false
            },
          },
        },
      }),
    ]
  },
})