// store/editorStore.ts
// Updated for Phase 2: adds focusMode to global state.
// Replace your existing store/editorStore.ts with this full file.

import { create } from 'zustand'

interface EditorStore {
  // Active context IDs
  activeProjectId: string | null
  activeBranchId: string | null
  activeDocumentId: string | null

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
  leftPanelOpen: true,
  rightPanelOpen: false,
  saveStatus: 'idle',
  focusMode: false,

  // Setters
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveBranch: (id) => set({ activeBranchId: id }),
  setActiveDocument: (id) => set({ activeDocumentId: id }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setFocusMode: (val) => set({ focusMode: val }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
}))