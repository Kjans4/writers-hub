// components/timeline/TimelineStrip.tsx
// Horizontal timeline strip showing all checkpoints for the current chapter.
// Rendered below the chapter title when the timeline is toggled open.
// Each checkpoint is a dot on the line — clicking it opens CheckpointPreview.
// The rightmost dot is always "Now" (the current unsaved state).

'use client'

import { useEffect, useState } from 'react'
import { useSnapshots } from '@/lib/hooks/useSnapshots'
import { Snapshot } from '@/lib/supabase/types'
import CheckpointPreview from './CheckpointPreview'
import { Loader2, Flag } from 'lucide-react'

interface TimelineStripProps {
  documentId: string
  branchId: string
  currentContent: string
  onRestore: (content: string) => void
  onClose: () => void
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function TimelineStrip({
  documentId,
  branchId,
  currentContent,
  onRestore,
  onClose,
}: TimelineStripProps) {
  const { getSnapshots, restoreSnapshot } = useSnapshots()
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState<Snapshot | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getSnapshots(documentId)
      // Reverse so oldest is on the left
      setSnapshots([...data].reverse())
      setLoading(false)
    }
    load()
  }, [documentId])

  async function handleRestore(snapshot: Snapshot) {
    setRestoring(true)
    const success = await restoreSnapshot({
      documentId,
      branchId,
      snapshot,
    })
    if (success) {
      onRestore(snapshot.content)
      setPreviewing(null)
    }
    setRestoring(false)
  }

  return (
    <>
      {/* Timeline strip */}
      <div className="max-w-[680px] mx-auto mb-6">
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm">

          {/* Strip header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] flex items-center gap-1.5">
              <Flag size={11} className="text-amber-500" />
              Checkpoints
            </span>
            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
            >
              Close
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="text-stone-300 animate-spin" />
            </div>
          )}

          {!loading && snapshots.length === 0 && (
            <p className="text-xs text-stone-300 font-['Inter'] text-center py-2">
              No checkpoints yet. Save one with ⌘⇧S.
            </p>
          )}

          {!loading && snapshots.length > 0 && (
            <div className="relative">
              {/* Horizontal line */}
              <div className="absolute top-3 left-0 right-0 h-px bg-stone-200" />

              {/* Dots */}
              <div className="relative flex items-start justify-between gap-2 overflow-x-auto pb-1">
                {snapshots.map((snapshot, index) => (
                  <button
                    key={snapshot.id}
                    onClick={() => setPreviewing(snapshot)}
                    className="flex flex-col items-center gap-2 flex-shrink-0 group"
                    title={snapshot.message ?? formatShortDate(snapshot.created_at)}
                  >
                    {/* Dot */}
                    <div className={`
                      w-3 h-3 rounded-full border-2 border-white ring-2 transition-all z-10 relative
                      ${index === snapshots.length - 1
                        ? 'bg-amber-500 ring-amber-300 group-hover:ring-amber-400'
                        : 'bg-stone-400 ring-stone-200 group-hover:bg-stone-600 group-hover:ring-stone-300'}
                    `} />

                    {/* Label */}
                    <div className="text-center max-w-[72px]">
                      <p className="text-xs text-stone-500 font-['Inter'] truncate leading-tight group-hover:text-stone-700 transition-colors">
                        {snapshot.message ?? '—'}
                      </p>
                      <p className="text-xs text-stone-300 font-['Inter'] mt-0.5">
                        {formatShortDate(snapshot.created_at)}
                      </p>
                    </div>
                  </button>
                ))}

                {/* "Now" dot */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200 z-10 relative" />
                  <div className="text-center max-w-[72px]">
                    <p className="text-xs text-emerald-600 font-['Inter'] font-medium">
                      Now
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkpoint preview modal */}
      {previewing && (
        <CheckpointPreview
          snapshot={previewing}
          onRestore={handleRestore}
          onClose={() => setPreviewing(null)}
        />
      )}
    </>
  )
}