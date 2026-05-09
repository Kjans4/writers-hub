// lib/hooks/useAutosave.ts
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent = useRef(content)
  const isMounted = useRef(true)

  // Keep ref current
  useEffect(() => {
    latestContent.current = content
  }, [content])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Don't fire on empty content
    if (!content) return

    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await onSave(latestContent.current)
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