// components/map/StoryMap.tsx

'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useStoryMap } from '@/lib/hooks/useStoryMap'
import { useEditorStore } from '@/store/editorStore'
import MapLegend from './MapLegend'
import { Loader2, RefreshCw } from 'lucide-react'
import { DocumentType } from '@/lib/supabase/types'

// 1. Cast to any and ensure ssr is false
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then((mod) => mod.default), // Note: .default for this package
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="text-stone-300 animate-spin" />
      </div>
    )
  }
) as any

interface StoryMapProps {
  projectId: string
  width?: number
  height?: number
  compact?: boolean
}

export default function StoryMap({
  projectId,
  width,
  height,
  compact = false,
}: StoryMapProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)

  const { activeBranchId } = useEditorStore()
  const { graphData, loading, refresh } = useStoryMap(projectId, activeBranchId)

  const [dims, setDims] = useState({ width: 800, height: 600 })

  // ── Robust Dimension Measuring ───────────────────────────
  useEffect(() => {
    if (width && height) {
      setDims({ width, height })
      return
    }

    // Guard against server-side execution
    if (typeof window === 'undefined') return

    function measure() {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    // Small timeout ensures the DOM has painted before we measure
    const timer = setTimeout(measure, 100)
    
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(timer)
    }
  }, [width, height])

  // ── Node click → navigate ─────────────────────────────────
  const handleNodeClick = useCallback(
    (node: any) => {
      if (!node) return
      if (node.type === 'chapter') {
        router.push(`/project/${projectId}/chapter/${node.id}`)
      } else {
        router.push(`/project/${projectId}/entity/${node.id}`)
      }
    },
    [projectId, router]
  )

  // ── Custom node canvas rendering ──────────────────────────
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r = compact
        ? Math.sqrt(node.val || 1) * 2
        : Math.sqrt(node.val || 1) * 2.5

      const x = node.x ?? 0
      const y = node.y ?? 0

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.fillStyle = node.color || '#d6d3d1'
      ctx.fill()

      // White border for chapters
      if (node.type === 'chapter') {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5 / globalScale
        ctx.stroke()
      }

      // Label
      const showLabel = globalScale > 1.2 || node.type === 'chapter'
      if (showLabel && !compact) {
        const fontSize = node.type === 'chapter'
          ? Math.max(10, 13 / globalScale)
          : Math.max(8, 10 / globalScale)

        ctx.font = `${node.type === 'chapter' ? '600' : '400'} ${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = node.type === 'chapter' ? '#1c1917' : '#57534e'
        
        const label = node.name || 'Untitled'
        ctx.fillText(
          label.length > 18 ? label.slice(0, 16) + '…' : label,
          x,
          y + r + fontSize * 0.9
        )
      }
    },
    [compact]
  )

  const [tooltip, setTooltip] = useState<{
    name: string
    type: DocumentType
    x: number
    y: number
  } | null>(null)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#faf9f7] overflow-hidden"
      style={height ? { height } : { minHeight: '400px' }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#faf9f7]/50">
          <Loader2 size={20} className="text-stone-300 animate-spin" />
        </div>
      )}

      {!loading && graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <p className="text-stone-400 font-['Inter'] text-sm text-center px-6">
            No nodes yet. Create chapters and use{' '}
            <span className="text-amber-600">[[wikilinks]]</span> to build your story map.
          </p>
        </div>
      )}

      {/* Only render graph if we have dimensions and nodes */}
      {!loading && graphData.nodes.length > 0 && dims.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          width={dims.width}
          height={dims.height}
          graphData={graphData}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onNodeHover={(node: any) => {
            if (node && typeof node.x === 'number') {
              setTooltip({
                name: node.name,
                type: node.type,
                x: node.x,
                y: node.y,
              })
            } else {
              setTooltip(null)
            }
          }}
          linkColor={() => '#e7e5e4'}
          linkWidth={1}
          linkDirectionalParticles={compact ? 0 : 1}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={() => '#d6d3d1'}
          cooldownTicks={compact ? 60 : 120}
          d3AlphaDecay={compact ? 0.04 : 0.02}
          d3VelocityDecay={0.3}
          enableZoomInteraction={!compact}
          enablePanInteraction={!compact}
        />
      )}

      {tooltip && !compact && (
        <div
          className="absolute z-20 pointer-events-none px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg shadow-md transition-opacity"
          style={{
            // Use screen coordinates if available, otherwise fallback
            left: Math.min(tooltip.x + 16, dims.width - 150),
            top: Math.max(tooltip.y - 36, 8),
          }}
        >
          <p className="text-xs font-semibold text-stone-700 font-['Inter']">
            {tooltip.name}
          </p>
          <p className="text-xs text-stone-400 capitalize font-['Inter']">
            {tooltip.type}
          </p>
        </div>
      )}

      {!compact && !loading && graphData.nodes.length > 0 && <MapLegend />}

      {!compact && (
        <button
          onClick={refresh}
          className="absolute top-4 right-4 p-2 bg-white/90 border border-stone-200 rounded-lg text-stone-400 hover:text-stone-600 shadow-sm transition-colors z-10"
          title="Refresh map"
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  )
}