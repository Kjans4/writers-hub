// components/editor/HistoryDrawer.tsx
// Slide-in drawer showing the full version history for a paragraph.
// Opened by the Rewrite button (Wand2) in the floating toolbar when
// the cursor is in a paragraph that already has saved versions.
// Each version shows: timestamp, content preview, and a "Restore" button.
// Restore sets the chosen version as current in the editor.

'use client'

import { useEffect, useState } from 'react'
import { useParagraphVersions } from '@/lib/hooks/useParagraphVersions'
import { ParagraphVersion } from '@/lib/supabase/types'
import { X, RotateCcw, Clock, Loader2 } from 'lucide-react'

interface HistoryDrawerProps {
  documentId: string
  paragraphKey: string
  onRestore: (content: string) => void
  onClose: () => void
}

export default function HistoryDrawer({
  documentId,
  paragraphKey,
  onRestore,
  onClose,
}: HistoryDrawerProps) {
  const { getVersionsForParagraph } = useParagraphVersions()
  const [versions, setVersions] = useState<ParagraphVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getVersionsForParagraph(documentId, paragraphKey)
      setVersions(data)
      setLoading(false)
    }
    load()
  }, [documentId, paragraphKey])

  function formatTime(iso: string) {
    const date = new Date(iso)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Strip HTML for display
  function stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent ?? div.innerText ?? ''
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-stone-200 shadow-xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-stone-400" />
            <h3 className="text-sm font-semibold text-stone-700 font-['Inter']">
              Paragraph History
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={14} />
          </button>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={16} className="text-stone-300 animate-spin" />
            </div>
          )}

          {!loading && versions.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-stone-400 font-['Inter']">
                No history yet for this paragraph.
              </p>
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="divide-y divide-stone-50">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="px-4 py-4 hover:bg-stone-50 transition-colors group"
                >
                  {/* Timestamp + current badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-stone-400 font-['Inter']">
                      {formatTime(version.created_at)}
                    </span>
                    {version.is_current && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-['Inter']">
                        Current
                      </span>
                    )}
                    {index === versions.length - 1 && !version.is_current && (
                      <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full font-['Inter']">
                        Original
                      </span>
                    )}
                  </div>

                  {/* Content preview */}
                  <p className="font-serif text-sm text-stone-600 leading-relaxed line-clamp-3 mb-3">
                    {stripHtml(version.content)}
                  </p>

                  {/* Restore button — hidden for current version */}
                  {!version.is_current && (
                    <button
                      onClick={() => {
                        onRestore(version.content)
                        onClose()
                      }}
                      className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <RotateCcw size={11} />
                      Restore this version
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0">
          <p className="text-xs text-stone-300 font-['Inter']">
            {versions.length} {versions.length === 1 ? 'version' : 'versions'} saved
          </p>
        </div>
      </div>
    </>
  )
}