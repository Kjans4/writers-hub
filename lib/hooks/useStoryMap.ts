// lib/hooks/useStoryMap.ts
// Fetches all documents, links, and entity states for a project branch.
// Transforms them into the node + edge format react-force-graph expects.
// Nodes: chapters (large) + entities (smaller, colored by type).
// Edges: one per row in the links table.
// States: attached to each node for dot indicator and tooltip on the map.
// Refreshes when projectId or branchId changes.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DocumentType } from '@/lib/supabase/types'

export interface MapNode {
  id: string
  name: string
  type: DocumentType
  val: number
  color: string
  // All states for this entity — no chapter filtering (god-view)
  states: { name: string; color: string; note: string | null }[]
}

export interface MapEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: MapNode[]
  links: MapEdge[]
}

const NODE_VAL: Record<DocumentType, number> = {
  chapter:   12,
  character: 6,
  location:  6,
  lore:      6,
  object:    6,
}

export const NODE_COLORS: Record<DocumentType, string> = {
  chapter:   '#44403c',
  character: '#7c3aed',
  location:  '#059669',
  lore:      '#d97706',
  object:    '#0284c7',
}

interface UseStoryMapReturn {
  graphData: GraphData
  loading: boolean
  refresh: () => void
}

// Supabase returns joined relations as arrays even for single-row joins.
// mark_labels is typed as array to match the actual runtime shape.
type StateRow = {
  entity_id: string
  note: string | null
  mark_labels: { name: string; color: string }[] | null
}

export function useStoryMap(
  projectId: string | null,
  branchId: string | null
): UseStoryMapReturn {
  const supabase = createClient()
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading]     = useState(true)
  const [tick, setTick]           = useState(0)

  function refresh() { setTick((t) => t + 1) }

  useEffect(() => {
    if (!projectId || !branchId) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)

      // Fetch documents, links, and entity states in parallel
      const [docsRes, linksRes, statesRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, title, type')
          .eq('project_id', projectId)
          .eq('branch_id', branchId),

        supabase
          .from('links')
          .select('source_doc_id, target_doc_id')
          .eq('project_id', projectId)
          .eq('branch_id', branchId),

        // All entity states for this branch with joined label name + color
        supabase
          .from('entity_states')
          .select('entity_id, note, mark_labels ( name, color )')
          .eq('branch_id', branchId),
      ])

      if (docsRes.error || !docsRes.data) {
        setLoading(false)
        return
      }

      // Build entity_id → states[] lookup map
      const statesByEntity = new Map<
        string,
        { name: string; color: string; note: string | null }[]
      >()

      for (const row of (statesRes.data ?? []) as unknown as StateRow[]) {
        // mark_labels comes back as an array from Supabase — take the first element
        const label = Array.isArray(row.mark_labels)
          ? row.mark_labels[0]
          : row.mark_labels
        if (!label) continue
        const existing = statesByEntity.get(row.entity_id) ?? []
        existing.push({
          name:  label.name,
          color: label.color,
          note:  row.note,
        })
        statesByEntity.set(row.entity_id, existing)
      }

      // Build node list with states attached
      const nodes: MapNode[] = docsRes.data.map((doc) => ({
        id:     doc.id,
        name:   doc.title,
        type:   doc.type as DocumentType,
        val:    NODE_VAL[doc.type as DocumentType] ?? 6,
        color:  NODE_COLORS[doc.type as DocumentType] ?? '#44403c',
        states: statesByEntity.get(doc.id) ?? [],
      }))

      // Build edge list — only include edges where both endpoints exist
      const nodeIds = new Set(nodes.map((n) => n.id))
      const edges: MapEdge[] = (linksRes.data ?? [])
        .filter(
          (l) => nodeIds.has(l.source_doc_id) && nodeIds.has(l.target_doc_id)
        )
        .map((l) => ({
          source: l.source_doc_id,
          target: l.target_doc_id,
        }))

      setGraphData({ nodes, links: edges })
      setLoading(false)
    }

    load()
  }, [projectId, branchId, tick])

  return { graphData, loading, refresh }
}