// components/layout/ForkModal.tsx
// Modal for creating a new story branch (fork).
// Writer names the branch (e.g. "Dark ending", "Alt timeline").
// On confirm: calls createBranch, then switches to the new branch.

'use client'

import { useState } from 'react'
import { GitBranch, X, Loader2 } from 'lucide-react'

interface ForkModalProps {
  canonBranchName: string
  onFork: (name: string) => Promise<void>
  onClose: () => void
}

export default function ForkModal({
  canonBranchName,
  onFork,
  onClose,
}: ForkModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFork() {
    if (!name.trim()) return
    setLoading(true)
    await onFork(name.trim())
    setLoading(false)
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
            <div className="p-1.5 bg-violet-50 rounded-lg">
              <GitBranch size={14} className="text-violet-600" />
            </div>
            <h3 className="font-serif text-lg text-stone-800">
              New branch
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={15} />
          </button>
        </div>

        {/* Info */}
        <div className="bg-stone-50 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-stone-500 font-['Inter'] leading-relaxed">
            Forking from{' '}
            <span className="font-semibold text-stone-700">{canonBranchName}</span>.
            All chapters and entities will be copied to the new branch.
            Your Canon is untouched.
          </p>
        </div>

        {/* Branch name */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
            Branch name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFork()
              if (e.key === 'Escape') onClose()
            }}
            autoFocus
            placeholder="Dark ending, Alt timeline, Experiment…"
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all"
          />
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
            onClick={handleFork}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Forking…
              </>
            ) : (
              <>
                <GitBranch size={13} />
                Fork branch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}