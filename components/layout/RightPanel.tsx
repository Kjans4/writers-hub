// components/layout/RightPanel.tsx
// Right sidebar panel. Placeholder for Phase 3 (entity details + story map toggle).
// Shows a gentle empty state until world-building is wired up.

'use client'

interface RightPanelProps {
  projectId: string
}

export default function RightPanel({ projectId }: RightPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="px-4 h-11 flex items-center border-b border-stone-100 flex-shrink-0">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter']">
          Details
        </span>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs text-stone-300 text-center font-['Inter'] leading-relaxed">
          Entity details and story map will appear here in Phase 3.
        </p>
      </div>
    </div>
  )
}