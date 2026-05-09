// app/(app)/project/[projectId]/layout.tsx
// Three-panel shell for the project workspace.
// Left panel: chapter + entity tree (collapsible)
// Center: editor area (always visible)
// Right panel: entity details / story map (collapsible)
// Uses Zustand for panel open/close state.

'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import LeftPanel from '@/components/layout/LeftPanel'
import RightPanel from '@/components/layout/RightPanel'
import SaveIndicator from '@/components/layout/SaveIndicator'
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const projectId = params.projectId as string

  const {
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    setActiveProject,
  } = useEditorStore()

  // Set active project in global store when layout mounts
  useEffect(() => {
    setActiveProject(projectId)
    return () => setActiveProject(null)
  }, [projectId])

  return (
    <div className="flex h-screen bg-[#faf9f7] overflow-hidden">

      {/* ── Left panel ──────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 border-r border-stone-200 bg-white
          transition-all duration-200 ease-in-out overflow-hidden
          ${leftPanelOpen ? 'w-60' : 'w-0'}
        `}
      >
        <div className="w-60 h-full">
          <LeftPanel projectId={projectId} />
        </div>
      </aside>

      {/* ── Center: editor + top bar ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top chrome bar */}
        <header className="h-11 flex-shrink-0 border-b border-stone-200 bg-white/90 backdrop-blur-sm flex items-center px-3 gap-2 z-10">

          {/* Toggle left panel */}
          <button
            onClick={toggleLeftPanel}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
            title={leftPanelOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {leftPanelOpen
              ? <PanelLeftClose size={16} />
              : <PanelLeftOpen size={16} />
            }
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Save indicator */}
          <SaveIndicator />

          {/* Toggle right panel */}
          <button
            onClick={toggleRightPanel}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
            title={rightPanelOpen ? 'Close details' : 'Open details'}
          >
            {rightPanelOpen
              ? <PanelRightClose size={16} />
              : <PanelRightOpen size={16} />
            }
          </button>
        </header>

        {/* Editor area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 border-l border-stone-200 bg-white
          transition-all duration-200 ease-in-out overflow-hidden
          ${rightPanelOpen ? 'w-72' : 'w-0'}
        `}
      >
        <div className="w-72 h-full">
          <RightPanel projectId={projectId} />
        </div>
      </aside>

    </div>
  )
}