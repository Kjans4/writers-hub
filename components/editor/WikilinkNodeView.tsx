// components/editor/WikilinkNodeView.tsx
// React NodeView for wikilink nodes.
// Renders [[title]] text + colored dot cluster for active entity states.

'use client'

import { useEffect, useState } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'   // ← use NodeViewProps
import { createClient } from '@/lib/supabase/client'
import { useEntityStates } from '@/lib/hooks/useEntityStates'
import { useEditorStore } from '@/store/editorStore'
import { EntityState } from '@/lib/supabase/types'

// Dot layout constants
const DOT_SIZE   = 8   // px diameter
const DOT_OFFSET = -4  // px overlap
const MAX_DOTS   = 5

// Module-level cache: "projectId:branchId:title" → entity id
const entityIdCache = new Map<string, string | null>()

// ── Use NodeViewProps from @tiptap/react — not a custom interface ──
export default function WikilinkNodeView({ node, editor }: NodeViewProps) {
  const supabase = createClient()
  const { getActiveStatesForEntity } = useEntityStates()
  const { activeDocumentOrderIndex } = useEditorStore()

  const [states, setStates] = useState<EntityState[]>([])

  // node.attrs is typed as generic Attrs — cast to access title safely
  const title: string = (node.attrs as { title: string }).title ?? ''

  const ext = editor?.extensionManager?.extensions?.find(
    (e: any) => e.name === 'wikilink'
  )
  const projectId: string = ext?.options?.projectId ?? ''
  const branchId: string  = ext?.options?.branchId  ?? ''

  useEffect(() => {
    if (!projectId || !branchId || !title) return

    async function load() {
      const cacheKey = `${projectId}:${branchId}:${title}`
      const cached   = entityIdCache.get(cacheKey)

      if (cached !== undefined) {
        if (cached === null) { setStates([]); return }
        const activeStates = await getActiveStatesForEntity(
          cached, branchId, activeDocumentOrderIndex ?? Infinity
        )
        setStates(activeStates)
        return
      }

      const { data } = await supabase
        .from('documents')
        .select('id')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)
        .eq('title', title)
        .neq('type', 'chapter')
        .single()

      const resolvedId = data?.id ?? null
      entityIdCache.set(cacheKey, resolvedId)

      if (!resolvedId) { setStates([]); return }

      const activeStates = await getActiveStatesForEntity(
        resolvedId, branchId, activeDocumentOrderIndex ?? Infinity
      )
      setStates(activeStates)
    }

    load()
  }, [title, projectId, branchId, activeDocumentOrderIndex])

  const visibleDots  = [...states].reverse().slice(0, MAX_DOTS)
  const clusterWidth = visibleDots.length > 0
    ? DOT_SIZE + (visibleDots.length - 1) * (DOT_SIZE + DOT_OFFSET)
    : 0

  return (
    <NodeViewWrapper
      as="span"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {visibleDots.length > 0 && (
        <span
          aria-hidden="true"
          style={{
            position:      'absolute',
            top:           -DOT_SIZE - 2,
            right:         0,
            width:         clusterWidth,
            height:        DOT_SIZE,
            display:       'flex',
            flexDirection: 'row-reverse',
            alignItems:    'center',
            pointerEvents: 'none',
            zIndex:        10,
          }}
        >
          {visibleDots.map((state, i) => (
            <span
              key={state.id}
              title={`${state.mark_labels?.name ?? ''}${state.note ? ` — ${state.note}` : ''}`}
              style={{
                width:        DOT_SIZE,
                height:       DOT_SIZE,
                borderRadius: '50%',
                background:   state.mark_labels?.color ?? '#a8a29e',
                border:       '1.5px solid white',
                flexShrink:   0,
                marginLeft:   i === 0 ? 0 : DOT_OFFSET,
                zIndex:       MAX_DOTS - i,
                position:     'relative',
              }}
            />
          ))}
        </span>
      )}

      <span
        data-wikilink=""
        data-title={title}
        className="wikilink"
      >
        {`[[${title}]]`}
      </span>
    </NodeViewWrapper>
  )
}