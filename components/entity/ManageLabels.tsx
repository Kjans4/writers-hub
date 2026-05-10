// components/entity/ManageLabels.tsx
// Modal for the project-wide label registry.
// Opened from the "Manage labels" link inside EntityStates.
// Writer can: create new labels, change color, rename, delete.
//
// Deleting a label cascades to all entity_states that use it.
// A confirmation prompt is shown before delete for this reason.
//
// Color picker is a row of preset hex swatches plus a native
// <input type="color"> for custom colors. No external library needed.

'use client'

import { useEffect, useState } from 'react'
import { useMarkLabels } from '@/lib/hooks/useMarkLabels'
import { MarkLabel } from '@/lib/supabase/types'
import { X, Plus, Trash2, Check, Loader2, Tag } from 'lucide-react'

// Preset swatches — covers the most common narrative states.
// Writer can still pick any color via the native color input.
const PRESET_COLORS = [
  '#ef4444', // red     — dead
  '#f97316', // orange  — injured / missing
  '#eab308', // yellow  — cursed / transformed
  '#22c55e', // green   — recovered / alive
  '#3b82f6', // blue    — imprisoned / bound
  '#8b5cf6', // violet  — magical / corrupted
  '#ec4899', // pink    — exiled / banished
  '#78716c', // stone   — neutral / unknown
]

interface ManageLabelsProps {
  projectId: string
  onClose: () => void
  // Called after any create/update/delete so EntityStates
  // can refresh its local label list
  onLabelsChanged: () => void
}

export default function ManageLabels({
  projectId,
  onClose,
  onLabelsChanged,
}: ManageLabelsProps) {
  const { getLabels, createLabel, updateLabel, deleteLabel } = useMarkLabels()

  const [labels, setLabels] = useState<MarkLabel[]>([])
  const [loading, setLoading] = useState(true)

  // New label form state
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [creating, setCreating] = useState(false)

  // Inline edit state — tracks which label is being renamed
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Load labels on mount ──────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getLabels(projectId)
      setLabels(data)
      setLoading(false)
    }
    load()
  }, [projectId])

  // ── Create label ──────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)

    const label = await createLabel(projectId, newName.trim(), newColor)
    if (label) {
      setLabels((prev) => [...prev, label])
      onLabelsChanged()
    }

    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setCreating(false)
  }

  // ── Update label color ────────────────────────────────────
  async function handleColorChange(id: string, color: string) {
    const updated = await updateLabel(id, { color })
    if (updated) {
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, color } : l))
      )
      onLabelsChanged()
    }
  }

  // ── Rename label ──────────────────────────────────────────
  async function handleRename(id: string) {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }
    const updated = await updateLabel(id, { name: editingName.trim() })
    if (updated) {
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, name: editingName.trim() } : l))
      )
      onLabelsChanged()
    }
    setEditingId(null)
  }

  // ── Delete label ──────────────────────────────────────────
  async function handleDelete(id: string) {
    const ok = await deleteLabel(id)
    if (ok) {
      setLabels((prev) => prev.filter((l) => l.id !== id))
      onLabelsChanged()
    }
    setDeletingId(null)
  }

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-stone-100 rounded-lg">
              <Tag size={14} className="text-stone-600" />
            </div>
            <h3 className="font-serif text-lg text-stone-800">Manage labels</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={15} />
          </button>
        </div>

        {/* Existing labels */}
        <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 size={14} className="text-stone-300 animate-spin" />
            </div>
          )}

          {!loading && labels.length === 0 && (
            <p className="text-xs text-stone-300 font-['Inter'] text-center py-2">
              No labels yet. Create your first one below.
            </p>
          )}

          {!loading && labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2 group">

              {/* Color swatch — click to open native color picker */}
              <label className="cursor-pointer flex-shrink-0 relative">
                <span
                  className="block w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110"
                  style={{ background: label.color }}
                />
                <input
                  type="color"
                  value={label.color}
                  onChange={(e) => handleColorChange(label.id, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Change color"
                />
              </label>

              {/* Label name — click to rename inline */}
              {editingId === label.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(label.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => handleRename(label.id)}
                  className="flex-1 text-sm font-['Inter'] text-stone-700 bg-stone-50 border border-amber-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-amber-400"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingId(label.id)
                    setEditingName(label.name)
                  }}
                  className="flex-1 text-left text-sm font-['Inter'] text-stone-700 hover:text-stone-900 transition-colors capitalize"
                >
                  {label.name}
                </button>
              )}

              {/* Delete button */}
              {deletingId === label.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-400 font-['Inter']">
                    Remove all uses?
                  </span>
                  <button
                    onClick={() => handleDelete(label.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-['Inter'] font-medium"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="text-xs text-stone-400 hover:text-stone-600 font-['Inter']"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingId(label.id)}
                  className="p-1 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
            New label
          </p>

          {/* Color presets */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className="w-5 h-5 rounded-full border transition-all hover:scale-110 flex-shrink-0"
                style={{
                  background: color,
                  borderColor: newColor === color ? '#1c1917' : 'transparent',
                  boxShadow: newColor === color ? '0 0 0 1px #1c1917' : 'none',
                }}
              />
            ))}
            {/* Custom color input */}
            <label className="cursor-pointer">
              <span
                className="block w-5 h-5 rounded-full border border-dashed border-stone-300 hover:border-stone-500 transition-colors flex items-center justify-center"
                style={{
                  background: PRESET_COLORS.includes(newColor)
                    ? 'transparent'
                    : newColor,
                }}
              />
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="sr-only"
                title="Custom color"
              />
            </label>
          </div>

          {/* Name input + create button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              placeholder="Label name…"
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-['Inter'] text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {creating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}