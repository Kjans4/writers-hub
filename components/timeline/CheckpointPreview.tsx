// components/timeline/CheckpointPreview.tsx
// Read-only preview of a chapter at a specific checkpoint.
// Shows the full chapter content as it was when the snapshot was taken.
// "Restore to this version" calls restoreSnapshot, reloads the editor.
// Content is rendered as HTML (the stored TipTap HTML output).

'use client'

import { Snapshot } from '@/lib/supabase/types'
import { X, RotateCcw, Flag } from 'lucide-react'

interface CheckpointPreviewProps {
  snapshot: Snapshot
  onRestore: (snapshot: Snapshot) => Promise<void>
  onClose: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function CheckpointPreview({
  snapshot,
  onRestore,
  onClose,
}: CheckpointPreviewProps) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[#faf9f7] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-stone-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Flag size={13} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 font-['Inter']">
                {snapshot.message ?? 'Checkpoint'}
              </p>
              <p className="text-xs text-stone-400 font-['Inter']">
                {formatDate(snapshot.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={15} />
          </button>
        </div>

        {/* Read-only content */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div
            className="editor-content pointer-events-none select-text"
            dangerouslySetInnerHTML={{ __html: snapshot.content }}
          />
        </div>

        {/* Footer with restore */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-white flex-shrink-0">
          <p className="text-xs text-stone-400 font-['Inter']">
            Read-only preview — your current chapter is unchanged
          </p>
          <button
            onClick={() => onRestore(snapshot)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
          >
            <RotateCcw size={13} />
            Restore to this version
          </button>
        </div>
      </div>
    </div>
  )
}