// app/(app)/project/[slug]/layout.tsx
// Updated for Phase 7: adds BranchDropdown to the top chrome bar.
// Replace your existing app/(app)/project/[slug]/layout.tsx with this file.

'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import LeftPanel from '@/components/layout/LeftPanel'
import RightPanel from '@/components/layout/RightPanel'
import SaveIndicator from '@/components/layout/SaveIndicator'
import BranchDropdown from '@/components/layout/BranchDropdown'
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Home,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()

  const {
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    setActiveProject,
  } = useEditorStore()

  useEffect(() => {
    setActiveProject(slug)
    return () => setActiveProject(null)
  }, [slug])

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
          <LeftPanel projectId={slug} />
        </div>
      </aside>

      {/* ── Center ───────────────────────────────────────── */}
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

          {/* Home / dashboard */}
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
            title="Dashboard"
          >
            <Home size={15} />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-stone-200" />

          {/* Branch dropdown */}
          <BranchDropdown slug={slug} />

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

      {/* ── Right panel ──────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 border-l border-stone-200 bg-white
          transition-all duration-200 ease-in-out overflow-hidden
          ${rightPanelOpen ? 'w-72' : 'w-0'}
        `}
      >
        <div className="w-72 h-full">
          <RightPanel projectId={slug} />
        </div>
      </aside>

    </div>
  )
}