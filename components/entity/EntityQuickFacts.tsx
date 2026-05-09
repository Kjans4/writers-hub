// components/entity/EntityQuickFacts.tsx
// Editable key-value quick facts panel for entity pages.
// Facts are stored in documents.metadata (JSONB).
// Supports: add new fact, edit value inline, delete fact.
// Saves to Supabase on every field blur.

'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface EntityQuickFactsProps {
  facts: Record<string, string>
  onSave: (facts: Record<string, string>) => Promise<void>
}

export default function EntityQuickFacts({
  facts,
  onSave,
}: EntityQuickFactsProps) {
  const [localFacts, setLocalFacts] = useState<Record<string, string>>(facts)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  async function handleValueChange(key: string, value: string) {
    const updated = { ...localFacts, [key]: value }
    setLocalFacts(updated)
    await onSave(updated)
  }

  async function handleDeleteFact(key: string) {
    const updated = { ...localFacts }
    delete updated[key]
    setLocalFacts(updated)
    await onSave(updated)
  }

  async function handleAddFact() {
    if (!newKey.trim() || !newValue.trim()) return
    const updated = { ...localFacts, [newKey.trim()]: newValue.trim() }
    setLocalFacts(updated)
    await onSave(updated)
    setNewKey('')
    setNewValue('')
    setAddingNew(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter']">
          Quick Facts
        </h3>
        <button
          onClick={() => setAddingNew(true)}
          className="p-1 text-stone-300 hover:text-amber-500 transition-colors"
          title="Add fact"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(localFacts).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 group">
            <span className="text-xs text-stone-400 font-['Inter'] w-24 flex-shrink-0 capitalize">
              {key}
            </span>
            <input
              type="text"
              defaultValue={value}
              onBlur={(e) => handleValueChange(key, e.target.value)}
              className="flex-1 text-xs text-stone-700 font-['Inter'] bg-transparent border-b border-transparent hover:border-stone-200 focus:border-amber-300 outline-none py-0.5 transition-colors"
            />
            <button
              onClick={() => handleDeleteFact(key)}
              className="p-0.5 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {/* Add new fact row */}
        {addingNew && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Label"
              autoFocus
              className="w-24 text-xs text-stone-600 font-['Inter'] bg-stone-50 border border-stone-200 rounded px-2 py-1 outline-none focus:border-amber-300"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFact()
                if (e.key === 'Escape') {
                  setAddingNew(false)
                  setNewKey('')
                  setNewValue('')
                }
              }}
              placeholder="Value"
              className="flex-1 text-xs text-stone-600 font-['Inter'] bg-stone-50 border border-stone-200 rounded px-2 py-1 outline-none focus:border-amber-300"
            />
            <button
              onClick={handleAddFact}
              disabled={!newKey.trim() || !newValue.trim()}
              className="text-xs text-amber-600 font-['Inter'] hover:text-amber-800 disabled:opacity-30 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        {Object.keys(localFacts).length === 0 && !addingNew && (
          <p className="text-xs text-stone-300 font-['Inter']">
            No facts yet. Click + to add one.
          </p>
        )}
      </div>
    </div>
  )
}