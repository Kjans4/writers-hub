// components/editor/RewriteSurface.tsx
// Modal surface that appears when the writer clicks "Rewrite" in the toolbar.
// Shows: the original paragraph, up to 3 rewrite attempts as text areas.
// Writer can add attempts, compare any two, or select one to use.
// "Use this" replaces the paragraph in the editor and saves a version row.

'use client'

import { useState, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { useParagraphVersions } from '@/lib/hooks/useParagraphVersions'
import { Plus, X, ArrowLeftRight, Check } from 'lucide-react'

interface RewriteSurfaceProps {
  editor: Editor | null
  documentId: string
  paragraphKey: string | null
  originalContent: string
  onClose: () => void
  onUse: (content: string) => void
  onCompare: (a: string, b: string) => void
}

export default function RewriteSurface({
  editor,
  documentId,
  paragraphKey,
  originalContent,
  onClose,
  onUse,
  onCompare,
}: RewriteSurfaceProps) {
  const { saveVersion } = useParagraphVersions()

  // Up to 3 attempts (not counting the original)
  const [attempts, setAttempts] = useState<string[]>([''])
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([])
  const MAX_ATTEMPTS = 3

  // Strip HTML tags for display in plain text areas
  function stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent ?? div.innerText ?? ''
  }

  const originalText = stripHtml(originalContent)

  function addAttempt() {
    if (attempts.length >= MAX_ATTEMPTS) return
    setAttempts((prev) => [...prev, ''])
  }

  function updateAttempt(index: number, value: string) {
    setAttempts((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function removeAttempt(index: number) {
    setAttempts((prev) => prev.filter((_, i) => i !== index))
    setSelectedForCompare((prev) => prev.filter((i) => i !== index))
  }

  // Toggle selection for compare (max 2)
  function toggleCompareSelect(index: number) {
    setSelectedForCompare((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index)
      if (prev.length >= 2) return [prev[1], index]
      return [...prev, index]
    })
  }

  async function handleUse(content: string) {
    if (paragraphKey && documentId) {
      await saveVersion(documentId, paragraphKey, content)
    }
    onUse(content)
    onClose()
  }

  function handleCompare() {
    if (selectedForCompare.length < 2) return
    const [a, b] = selectedForCompare

    // -1 = original, 0+ = attempt index
    const contentA = a === -1 ? originalText : attempts[a]
    const contentB = b === -1 ? originalText : attempts[b]

    if (contentA && contentB) {
      onCompare(contentA, contentB)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <h3 className="font-serif text-lg text-stone-800">Rewrite</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Original paragraph */}
          <div className="group relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter']">
                Original
              </span>
              <div className="flex items-center gap-2">
                {/* Compare toggle for original */}
                <button
                  onClick={() => toggleCompareSelect(-1)}
                  className={`
                    text-xs font-['Inter'] px-2 py-0.5 rounded-full border transition-colors
                    ${selectedForCompare.includes(-1)
                      ? 'border-amber-400 text-amber-700 bg-amber-50'
                      : 'border-stone-200 text-stone-400 hover:border-stone-300'}
                  `}
                >
                  {selectedForCompare.includes(-1) ? '✓ Selected' : 'Compare'}
                </button>
                <button
                  onClick={() => handleUse(originalContent)}
                  className="text-xs font-['Inter'] text-stone-500 hover:text-stone-700 px-2 py-0.5 rounded-full border border-stone-200 hover:border-stone-300 transition-colors"
                >
                  Use this
                </button>
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl px-4 py-3 font-serif text-base text-stone-600 leading-relaxed">
              {originalText}
            </div>
          </div>

          {/* Rewrite attempts */}
          {attempts.map((attempt, index) => (
            <div key={index} className="group relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter']">
                  Attempt {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {/* Compare toggle */}
                  {attempt.trim() && (
                    <button
                      onClick={() => toggleCompareSelect(index)}
                      className={`
                        text-xs font-['Inter'] px-2 py-0.5 rounded-full border transition-colors
                        ${selectedForCompare.includes(index)
                          ? 'border-amber-400 text-amber-700 bg-amber-50'
                          : 'border-stone-200 text-stone-400 hover:border-stone-300'}
                      `}
                    >
                      {selectedForCompare.includes(index) ? '✓ Selected' : 'Compare'}
                    </button>
                  )}
                  {/* Use this */}
                  {attempt.trim() && (
                    <button
                      onClick={() => handleUse(attempt)}
                      className="text-xs font-['Inter'] text-emerald-600 hover:text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 hover:border-emerald-300 transition-colors flex items-center gap-1"
                    >
                      <Check size={10} />
                      Use this
                    </button>
                  )}
                  {/* Remove attempt */}
                  {attempts.length > 1 && (
                    <button
                      onClick={() => removeAttempt(index)}
                      className="p-0.5 text-stone-300 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={attempt}
                onChange={(e) => updateAttempt(index, e.target.value)}
                placeholder="Write your rewrite here…"
                rows={4}
                className="w-full px-4 py-3 font-serif text-base text-stone-700 leading-relaxed bg-white border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder:text-stone-300"
              />
            </div>
          ))}

          {/* Add attempt button */}
          {attempts.length < MAX_ATTEMPTS && (
            <button
              onClick={addAttempt}
              className="w-full py-2.5 border border-dashed border-stone-200 rounded-xl text-sm text-stone-400 hover:text-stone-600 hover:border-stone-300 font-['Inter'] transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={13} />
              Add another attempt
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-stone-400 font-['Inter']">
            {selectedForCompare.length === 2
              ? 'Ready to compare'
              : selectedForCompare.length === 1
              ? 'Select one more to compare'
              : 'Select two versions to compare side by side'}
          </p>
          <button
            onClick={handleCompare}
            disabled={selectedForCompare.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeftRight size={13} />
            Compare
          </button>
        </div>
      </div>
    </div>
  )
}