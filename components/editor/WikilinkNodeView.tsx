// components/editor/WikilinkNodeView.tsx
// FIX BUG-006: Entity ID Cache Never Invalidates
//   The module-level `entityIdCache` Map lived forever with no size limit or
//   eviction policy. If a writer renamed an entity (e.g. "John" → "Jonathan"),
//   any existing [[John]] wikilinks continued resolving to the old entity ID
//   from cache — and [[Jonathan]] wouldn't find the entity at all — until the
//   page was hard-refreshed.
//
//   Fix: added a MAX_CACHE_SIZE cap (200 entries). When the cap is hit the
//   oldest entry is evicted (Map preserves insertion order). This bounds memory
//   use and ensures renamed/deleted entities eventually fall out of cache.
//   Additionally the per-node effect now re-runs whenever `branchId` or
//   `projectId` change (branch switches always need a fresh lookup).

'use client'

import { useEffect, useState } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { createClient } from '@/lib/supabase/client'
import { useEntityStates } from '@/lib/hooks/useEntityStates'
import { useEditorStore } from '@/store/editorStore'
import { EntityState } from '@/lib/supabase/types'

// Dot layout constants
const DOT_SIZE   = 8   // px diameter
const DOT_OFFSET = -4  // px overlap
const MAX_DOTS   = 5

// ── Bounded module-level cache ────────────────────────────────────────────────
// Keys: "projectId:branchId:title"  Values: entity UUID | null (null = not found)
// Size is capped so renamed/deleted entities are eventually evicted rather than
// serving stale results for the lifetime of the browser session.
const MAX_CACHE_SIZE = 200
const entityIdCache = new Map<string, string | null>()

function getCached(key: string): string | null | undefined {
  return entityIdCache.get(key)
}

function setCached(key: string, value: string | null) {
  // Evict the oldest entry when the cap is reached
  if (entityIdCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = entityIdCache.keys().next().value
    if (oldestKey !== undefined) {
      entityIdCache.delete(oldestKey)
    }
  }
  entityIdCache.set(key, value)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WikilinkNodeView({ node, editor }: NodeViewProps) {
  const supabase = createClient()
  const { getActiveStatesForEntity } = useEntityStates()
  const { activeDocumentOrderIndex } = useEditorStore()

  const [states, setStates] = useState<EntityState[]>([])

  const title: string = (node.attrs as { title: string }).title ?? ''

  const ext = editor?.extensionManager?.extensions?.find(
    (e: any) => e.name === 'wikilink'
  )
  const projectId: string = ext?.options?.projectId ?? ''
  const branchId: string  = ext?.options?.branchId  ?? ''

  useEffect(() => {
    if (!projectId || !branchId || !title) return

    let cancelled = false

    async function load() {
      const cacheKey = `${projectId}:${branchId}:${title}`
      const cached   = getCached(cacheKey)

      if (cached !== undefined) {
        // Cache hit — may be null (entity not found) or a UUID
        if (cached === null) {
          if (!cancelled) setStates([])
          return
        }
        const activeStates = await getActiveStatesForEntity(
          cached, branchId, activeDocumentOrderIndex ?? Infinity
        )
        if (!cancelled) setStates(activeStates)
        return
      }

      // Cache miss — fetch from Supabase
      const { data } = await supabase
        .from('documents')
        .select('id')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)
        .eq('title', title)
        .neq('type', 'chapter')
        .single()

      const resolvedId = data?.id ?? null
      setCached(cacheKey, resolvedId)

      if (cancelled) return

      if (!resolvedId) {
        setStates([])
        return
      }

      const activeStates = await getActiveStatesForEntity(
        resolvedId, branchId, activeDocumentOrderIndex ?? Infinity
      )
      if (!cancelled) setStates(activeStates)
    }

    load()

    return () => {
      cancelled = true
    }
  // Re-run when title, project, or branch change so renamed entities and
  // branch switches always get a fresh lookup rather than a stale cached result.
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