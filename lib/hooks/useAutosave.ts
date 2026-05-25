// lib/hooks/useAutosave.ts
// FIX BUG-014: Stale onSave Closure
//   `onSave` was captured in the setTimeout closure but was missing from the
//   useEffect dependency array. If the parent component passed a new `onSave`
//   reference between renders (e.g. after a document switch), the debounce
//   timer would still fire the old callback. Fixed by tracking `onSave` in a
//   ref so the timer always calls the latest version without needing it in the
//   dependency array (which would reset the debounce on every render).
//
// Debounced autosave hook — fires 1500ms after the last content change.
// Updates saveStatus in Zustand store so SaveIndicator can react.
// Pass the current content string and the save function.

import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'

interface UseAutosaveOptions {
  content: string
  onSave: (content: string) => Promise<void>
  delay?: number
  enabled?: boolean
}

export function useAutosave({
  content,
  onSave,
  delay = 1500,
  enabled = true,
}: UseAutosaveOptions) {
  const { setSaveStatus } = useEditorStore()
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent  = useRef(content)
  const isMounted      = useRef(true)

  // FIX BUG-014: keep a ref to the latest onSave so the timer closure always
  // calls the current version. Without this, if the parent passes a new onSave
  // (e.g. after switching chapters), the stale callback from the previous
  // render is used — potentially saving to the wrong document.
  const latestOnSave = useRef(onSave)

  // Keep refs current on every render
  useEffect(() => {
    latestContent.current = content
  }, [content])

  useEffect(() => {
    latestOnSave.current = onSave
  }, [onSave])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    if (timerRef.current) clearTimeout(timerRef.current)

    if (!content) return

    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        // FIX BUG-014: call via ref so we always get the latest onSave,
        // not the one captured when this effect last ran
        await latestOnSave.current(latestContent.current)
        if (isMounted.current) setSaveStatus('saved')
      } catch {
        if (isMounted.current) setSaveStatus('error')
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, delay, enabled])
}