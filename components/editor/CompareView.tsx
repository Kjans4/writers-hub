// components/editor/CompareView.tsx
// Two-column clean prose compare view.
// No red/green diff colors — just two paragraphs side by side.
// The writer reads both and feels which is better.
// "Use this" button under each column picks that version.

'use client'

import { X, Check } from 'lucide-react'

interface CompareViewProps {
  versionA: string
  versionB: string
  labelA?: string
  labelB?: string
  onUse: (content: string) => void
  onClose: () => void
}

export default function CompareView({
  versionA,
  versionB,
  labelA = 'Version A',
  labelB = 'Version B',
  onUse,
  onClose,
}: CompareViewProps) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h3 className="font-serif text-lg text-stone-800">Compare versions</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Two columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 divide-x divide-stone-100 h-full">

            {/* Column A */}
            <div className="flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter']">
                  {labelA}
                </span>
                <button
                  onClick={() => {
                    onUse(versionA)
                    onClose()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg font-['Inter'] transition-colors"
                >
                  <Check size={11} />
                  Use this
                </button>
              </div>
              <div className="font-serif text-[17px] text-stone-700 leading-[1.85] flex-1">
                {versionA}
              </div>
            </div>

            {/* Column B */}
            <div className="flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter']">
                  {labelB}
                </span>
                <button
                  onClick={() => {
                    onUse(versionB)
                    onClose()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg font-['Inter'] transition-colors"
                >
                  <Check size={11} />
                  Use this
                </button>
              </div>
              <div className="font-serif text-[17px] text-stone-700 leading-[1.85] flex-1">
                {versionB}
              </div>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-stone-100 flex-shrink-0">
          <p className="text-xs text-stone-300 font-['Inter'] text-center">
            Read both. Feel which is better. The other one isn't lost.
          </p>
        </div>
      </div>
    </div>
  )
}