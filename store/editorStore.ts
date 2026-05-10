// store/editorStore.ts
// Full replacement — adds activeDocumentOrderIndex field.

import { create } from 'zustand'

interface EditorStore {
  // Active context IDs
  activeProjectId: string | null
  activeBranchId: string | null
  activeDocumentId: string | null

  // NEW — order_index of the currently open chapter document.
  // null when no chapter is open (e.g. on entity pages or dashboard).
  // Used by HoverCard (Phase C) and EntityStateDots (Phase D) to
  // filter entity states to only those that have "happened" yet.
  activeDocumentOrderIndex: number | null

  // Panel visibility
  leftPanelOpen: boolean
  rightPanelOpen: boolean

  // Autosave feedback
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'

  // Focus mode
  focusMode: boolean

  // Actions
  setActiveProject: (id: string | null) => void
  setActiveBranch: (id: string | null) => void
  setActiveDocument: (id: string | null) => void
  setActiveDocumentOrderIndex: (index: number | null) => void  // NEW
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  setFocusMode: (val: boolean) => void
  toggleFocusMode: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  activeProjectId: null,
  activeBranchId: null,
  activeDocumentId: null,
  activeDocumentOrderIndex: null,    // NEW
  leftPanelOpen: true,
  rightPanelOpen: false,
  saveStatus: 'idle',
  focusMode: false,

  // Setters
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveBranch: (id) => set({ activeBranchId: id }),
  setActiveDocument: (id) => set({ activeDocumentId: id }),
  setActiveDocumentOrderIndex: (index) =>             // NEW
    set({ activeDocumentOrderIndex: index }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setFocusMode: (val) => set({ focusMode: val }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
}))