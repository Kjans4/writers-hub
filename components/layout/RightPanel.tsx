// components/layout/RightPanel.tsx
// Updated for Phase 4: shows StoryMap embedded in the right panel.
// Replaces the Phase 1B placeholder version.
// Toggle between "Map" view and future "Details" view via tab buttons.

'use client'

import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import StoryMap from '@/components/map/StoryMap'
import { Map, Info } from 'lucide-react'

interface RightPanelProps {
  projectId: string
}

type PanelTab = 'map' | 'details'

export default function RightPanel({ projectId }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('map')
  const { activeBranchId } = useEditorStore()

  return (
    <div className="h-full flex flex-col">

      {/* ── Panel header with tabs ───────────────────── */}
      <div className="h-11 flex items-center border-b border-stone-100 flex-shrink-0 px-2 gap-1">
        <button
          onClick={() => setActiveTab('map')}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-['Inter']
            transition-colors
            ${activeTab === 'map'
              ? 'bg-stone-100 text-stone-700 font-medium'
              : 'text-stone-400 hover:text-stone-600'
            }
          `}
        >
          <Map size={12} />
          Story Map
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-['Inter']
            transition-colors
            ${activeTab === 'details'
              ? 'bg-stone-100 text-stone-700 font-medium'
              : 'text-stone-400 hover:text-stone-600'
            }
          `}
        >
          <Info size={12} />
          Details
        </button>
      </div>

      {/* ── Panel body ───────────────────────────────── */}
      <div className="flex-1 overflow-hidden">

        {/* Story Map tab */}
        {activeTab === 'map' && activeBranchId && (
          <div className="h-full">
            <StoryMap
              projectId={projectId}
              compact={true}
            />
          </div>
        )}

        {activeTab === 'map' && !activeBranchId && (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-xs text-stone-300 text-center font-['Inter']">
              Loading branch…
            </p>
          </div>
        )}

        {/* Details tab — placeholder for entity details */}
        {activeTab === 'details' && (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-xs text-stone-300 text-center font-['Inter'] leading-relaxed">
              Click an entity in the story map or open an entity page to see details here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}