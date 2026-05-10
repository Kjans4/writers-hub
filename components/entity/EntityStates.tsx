// components/entity/EntityStates.tsx
// The "States" section on entity pages.
// Lists all states (marks) applied to this entity in timeline order.
// Each row: colored dot + label name + chapter name + optional note + delete.
//
// "Add state" inline form: label picker → chapter picker → note field.
// "Manage labels" link opens the ManageLabels modal.
//
// Chapter picker defaults to the currently open chapter (from Zustand store)
// if the writer is navigating from an editor session. Falls back to a
// manual dropdown if no chapter is active (entity page opened directly).
//
// Props:
//   entityId   — the document id of this entity
//   projectId  — used to load labels and chapter list
//   branchId   — entity states are branch-scoped

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEntityStates } from '@/lib/hooks/useEntityStates'
import { useMarkLabels } from '@/lib/hooks/useMarkLabels'
import { useEditorStore } from '@/store/editorStore'
import { EntityState, MarkLabel, Document } from '@/lib/supabase/types'
import ManageLabels from './ManageLabels'
import {
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  Settings,
  Milestone,
} from 'lucide-react'

interface EntityStatesProps {
  entityId: string
  projectId: string
  branchId: string
}

export default function EntityStates({
  entityId,
  projectId,
  branchId,
}: EntityStatesProps) {
  const supabase = createClient()
  const { getStatesForEntity, addState, deleteState } = useEntityStates()
  const { getLabels } = useMarkLabels()
  const { activeDocumentId, activeDocumentOrderIndex } = useEditorStore()

  const [states, setStates] = useState<EntityState[]>([])
  const [labels, setLabels] = useState<MarkLabel[]>([])
  const [chapters, setChapters] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showManageLabels, setShowManageLabels] = useState(false)

  // Add-state form state
  const [adding, setAdding] = useState(false)
  const [selectedLabelId, setSelectedLabelId] = useState<string>('')
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Load states + labels + chapters ──────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)

      const [statesData, labelsData, chaptersData] = await Promise.all([
        getStatesForEntity(entityId, branchId),
        getLabels(projectId),

        // Fetch all chapters for this branch in order — used for chapter picker
        supabase
          .from('documents')
          .select('id, title, order_index, type, project_id, branch_id, content, metadata, created_at, updated_at')
          .eq('project_id', projectId)
          .eq('branch_id', branchId)
          .eq('type', 'chapter')
          .order('order_index', { ascending: true })
          .then(({ data }) => (data as Document[]) ?? []),
      ])

      setStates(statesData)
      setLabels(labelsData)
      setChapters(chaptersData)

      // Pre-select defaults for the add form:
      // Label → first label alphabetically if any exist
      if (labelsData.length > 0) setSelectedLabelId(labelsData[0].id)

      // Chapter → active chapter from editor store if available,
      // otherwise first chapter in list
      if (activeDocumentId) {
        setSelectedChapterId(activeDocumentId)
      } else if (chaptersData.length > 0) {
        setSelectedChapterId(chaptersData[0].id)
      }

      setLoading(false)
    }
    load()
  }, [entityId, branchId, projectId])

  // ── Refresh labels after ManageLabels changes ─────────────
  async function refreshLabels() {
    const data = await getLabels(projectId)
    setLabels(data)
    if (data.length > 0 && !selectedLabelId) {
      setSelectedLabelId(data[0].id)
    }
  }

  // ── Add state ─────────────────────────────────────────────
  async function handleAdd() {
    if (!selectedLabelId || !selectedChapterId) return
    setSaving(true)

    const state = await addState({
      entityId,
      branchId,
      chapterId: selectedChapterId,
      labelId: selectedLabelId,
      note,
    })

    if (state) {
      // Re-fetch to get joined data in correct sort order
      const updated = await getStatesForEntity(entityId, branchId)
      setStates(updated)
    }

    setNote('')
    setAdding(false)
    setSaving(false)
  }

  // ── Delete state ──────────────────────────────────────────
  async function handleDelete(id: string) {
    const ok = await deleteState(id)
    if (ok) setStates((prev) => prev.filter((s) => s.id !== id))
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 size={14} className="text-stone-300 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] flex items-center gap-1.5">
          <Milestone size={11} />
          States
        </h3>
        <div className="flex items-center gap-2">
          {/* Manage labels link */}
          <button
            onClick={() => setShowManageLabels(true)}
            className="text-xs text-stone-300 hover:text-stone-500 font-['Inter'] flex items-center gap-1 transition-colors"
          >
            <Settings size={11} />
            Manage labels
          </button>
          {/* Add state button */}
          <button
            onClick={() => setAdding(true)}
            className="p-1 text-stone-300 hover:text-amber-500 transition-colors"
            title="Add state"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* State list */}
      <div className="space-y-2">
        {states.length === 0 && !adding && (
          <p className="text-xs text-stone-300 font-['Inter']">
            No states yet. Click + to add one.
          </p>
        )}

        {states.map((state) => {
          const labelColor = state.mark_labels?.color ?? '#a8a29e'
          const labelName  = state.mark_labels?.name  ?? 'Unknown'
          const chapterTitle = state.chapter?.title   ?? 'Unknown chapter'

          return (
            <div
              key={state.id}
              className="flex items-start gap-2.5 group py-1"
            >
              {/* Colored dot */}
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                style={{ background: labelColor }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-medium font-['Inter'] capitalize"
                    style={{ color: labelColor }}
                  >
                    {labelName}
                  </span>
                  <span className="text-xs text-stone-300 font-['Inter']">
                    from
                  </span>
                  <span className="text-xs text-stone-500 font-['Inter'] truncate max-w-[140px]">
                    {chapterTitle}
                  </span>
                </div>
                {state.note && (
                  <p className="text-xs text-stone-400 font-['Inter'] mt-0.5 leading-relaxed">
                    "{state.note}"
                  </p>
                )}
              </div>

              {/* Delete */}
              {deletingId === state.id ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(state.id)}
                    className="text-xs text-red-500 font-['Inter'] font-medium"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="text-xs text-stone-400 font-['Inter']"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingId(state.id)}
                  className="p-0.5 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          )
        })}

        {/* Add state form — inline */}
        {adding && (
          <div className="bg-stone-50 rounded-xl p-3 space-y-2.5 mt-2">

            {/* Label picker */}
            <div>
              <label className="block text-xs text-stone-400 font-['Inter'] mb-1">
                Label
              </label>
              {labels.length === 0 ? (
                <p className="text-xs text-stone-300 font-['Inter']">
                  No labels yet.{' '}
                  <button
                    onClick={() => setShowManageLabels(true)}
                    className="text-amber-500 underline underline-offset-2"
                  >
                    Create one first
                  </button>
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => setSelectedLabelId(label.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-['Inter'] border transition-all"
                      style={{
                        background:
                          selectedLabelId === label.id
                            ? label.color + '20'
                            : 'transparent',
                        borderColor:
                          selectedLabelId === label.id
                            ? label.color
                            : '#e7e5e4',
                        color:
                          selectedLabelId === label.id
                            ? label.color
                            : '#78716c',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: label.color }}
                      />
                      {label.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter picker */}
            <div>
              <label className="block text-xs text-stone-400 font-['Inter'] mb-1">
                Begins from chapter
              </label>
              <div className="relative">
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-['Inter'] text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all pr-8"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                      {ch.id === activeDocumentId ? ' (current)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
              </div>
              {/* Hint if inferred from active chapter */}
              {activeDocumentId && selectedChapterId === activeDocumentId && (
                <p className="text-xs text-stone-300 font-['Inter'] mt-1">
                  Auto-set to your current chapter
                </p>
              )}
            </div>

            {/* Note field */}
            <div>
              <label className="block text-xs text-stone-400 font-['Inter'] mb-1">
                Note{' '}
                <span className="text-stone-300">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') {
                    setAdding(false)
                    setNote('')
                  }
                }}
                placeholder="e.g. Killed by Mordred at the Battle of Camlann"
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-['Inter'] text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={() => {
                  setAdding(false)
                  setNote('')
                }}
                className="flex-1 py-2 border border-stone-200 text-stone-500 hover:text-stone-700 text-xs font-medium rounded-lg font-['Inter'] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedLabelId || !selectedChapterId || saving}
                className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  'Add state'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manage labels modal */}
      {showManageLabels && (
        <ManageLabels
          projectId={projectId}
          onClose={() => setShowManageLabels(false)}
          onLabelsChanged={refreshLabels}
        />
      )}
    </div>
  )
}