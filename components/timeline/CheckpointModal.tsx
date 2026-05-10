// components/timeline/CheckpointModal.tsx
// Modal for saving a named checkpoint of the current chapter.
// Writer can add an optional message (e.g. "End of Act 1").
// Clicking "Save checkpoint" calls createSnapshot and closes.

'use client'

import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'

interface CheckpointModalProps {
  onSave: (message: string) => Promise<void>
  onClose: () => void
}

export default function CheckpointModal({
  onSave,
  onClose,
}: CheckpointModalProps) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(message)
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Flag size={14} className="text-amber-600" />
            </div>
            <h3 className="font-serif text-lg text-stone-800">
              Save checkpoint
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={15} />
          </button>
        </div>

        {/* Message input */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
            Message{' '}
            <span className="normal-case text-stone-300">(optional)</span>
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onClose()
            }}
            autoFocus
            placeholder="End of Act 1, Before the twist, Draft 2…"
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
          />
          <p className="text-xs text-stone-300 font-['Inter'] mt-1.5">
            A snapshot of this chapter will be saved as it is right now.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </>
            ) : (
              'Save checkpoint'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}