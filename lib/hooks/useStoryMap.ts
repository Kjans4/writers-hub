// lib/hooks/useStoryMap.ts
// Fetches all documents and links for a project branch,
// and transforms them into the node + edge format react-force-graph expects.
// Nodes: chapters (large) + entities (smaller, colored by type).
// Edges: one per row in the links table.
// Refreshes when projectId or branchId changes.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DocumentType } from '@/lib/supabase/types'

export interface MapNode {
  id: string
  name: string
  type: DocumentType
  val: number        // controls node size in react-force-graph
  color: string
}

export interface MapEdge {
  source: string
  target: string
}

export interface GraphData {
  nodes: MapNode[]
  links: MapEdge[]
}

// Node size: chapters are bigger
const NODE_VAL: Record<DocumentType, number> = {
  chapter:   12,
  character: 6,
  location:  6,
  lore:      6,
  object:    6,
}

// Node colors per type
export const NODE_COLORS: Record<DocumentType, string> = {
  chapter:   '#44403c',   // stone-700
  character: '#7c3aed',   // violet-600
  location:  '#059669',   // emerald-600
  lore:      '#d97706',   // amber-600
  object:    '#0284c7',   // sky-600
}

interface UseStoryMapReturn {
  graphData: GraphData
  loading: boolean
  refresh: () => void
}

export function useStoryMap(
  projectId: string | null,
  branchId: string | null
): UseStoryMapReturn {
  const supabase = createClient()
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  function refresh() {
    setTick((t) => t + 1)
  }

  useEffect(() => {
    if (!projectId || !branchId) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)

      // 1. Fetch all documents for this branch
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id, title, type')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)

      if (docsError || !docs) {
        setLoading(false)
        return
      }

      // 2. Fetch all links for this branch
      const { data: links, error: linksError } = await supabase
        .from('links')
        .select('source_doc_id, target_doc_id')
        .eq('project_id', projectId)
        .eq('branch_id', branchId)

      if (linksError) {
        setLoading(false)
        return
      }

      // 3. Build node list
      const nodes: MapNode[] = docs.map((doc) => ({
        id: doc.id,
        name: doc.title,
        type: doc.type as DocumentType,
        val: NODE_VAL[doc.type as DocumentType] ?? 6,
        color: NODE_COLORS[doc.type as DocumentType] ?? '#44403c',
      }))

      // 4. Build edge list — only include edges where both endpoints exist
      const nodeIds = new Set(nodes.map((n) => n.id))
      const edges: MapEdge[] = (links ?? [])
        .filter(
          (l) =>
            nodeIds.has(l.source_doc_id) && nodeIds.has(l.target_doc_id)
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