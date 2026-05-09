// components/layout/SaveIndicator.tsx
// Autosave status indicator shown in the top chrome bar.
// Watches saveStatus from Zustand store.
// "Saving…" shows a spinner; "Saved" flashes for 1 second then disappears.
// Error state shows a subtle red dot.

'use client'

import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Loader2, Check, AlertCircle } from 'lucide-react'

export default function SaveIndicator() {
  const { saveStatus } = useEditorStore()
  const [visible, setVisible] = useState(false)

  // "Saved" disappears after 1 second
  useEffect(() => {
    if (saveStatus === 'saving' || saveStatus === 'error') {
      setVisible(true)
      return
    }
    if (saveStatus === 'saved') {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 1000)
      return () => clearTimeout(timer)
    }
    setVisible(false)
  }, [saveStatus])

  if (!visible) return null

  return (
    <div className="flex items-center gap-1.5 font-['Inter']">
      {saveStatus === 'saving' && (
        <>
          <Loader2 size={12} className="text-stone-400 animate-spin" />
          <span className="text-xs text-stone-400">Saving…</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check size={12} className="text-emerald-500" />
          <span className="text-xs text-emerald-500">Saved</span>
        </>
      )}
      {saveStatus === 'error' && (
        <>
          <AlertCircle size={12} className="text-red-400" />
          <span className="text-xs text-red-400">Save failed</span>
        </>
      )}
    </div>
  )
}