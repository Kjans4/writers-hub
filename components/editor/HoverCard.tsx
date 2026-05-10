// component/editor/HoverCard.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEntityStates } from '@/lib/hooks/useEntityStates'
import { useEditorStore } from '@/store/editorStore'
import { Document, DocumentType, EntityState } from '@/lib/supabase/types'
import { User, MapPin, Scroll, Package, ExternalLink, Loader2 } from 'lucide-react'

interface HoverCardProps {
  projectId: string
  branchId: string
}

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  chapter:   <Scroll size={13} />,
  character: <User size={13} />,
  location:  <MapPin size={13} />,
  lore:      <Scroll size={13} />,
  object:    <Package size={13} />,
}

const TYPE_COLORS: Record<DocumentType, string> = {
  chapter:   'text-stone-400 bg-stone-50',
  character: 'text-violet-500 bg-violet-50',
  location:  'text-emerald-600 bg-emerald-50',
  lore:      'text-amber-600 bg-amber-50',
  object:    'text-sky-500 bg-sky-50',
}

export default function HoverCard({ projectId, branchId }: HoverCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const { getActiveStatesForEntity } = useEntityStates()

  const { activeDocumentOrderIndex } = useEditorStore()

  const [entity, setEntity]   = useState<Document | null>(null)
  const [states, setStates]   = useState<EntityState[]>([])
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function handleHover(e: Event) {
      const { title, rect } = (e as CustomEvent).detail as {
        title: string
        rect: DOMRect
      }

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

      showTimerRef.current = setTimeout(async () => {
        setLoading(true)
        setVisible(true)

        const cardWidth = 260
        const scrollY = window.scrollY
        setPosition({
          top:  rect.top + scrollY - 8,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - cardWidth - 8)),
        })

        // ── UPDATED FETCH LOGIC ────────────────────────────────
        // Fetch entity first
        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .eq('branch_id', branchId)
          .eq('title', title)
          .single()

        const entityData = data as Document | null
        setEntity(entityData)

        // Then fetch active states with the real entity id
        if (entityData) {
          const activeStates = await getActiveStatesForEntity(
            entityData.id,
            branchId,
            activeDocumentOrderIndex ?? Infinity
          )
          setStates(activeStates)
        } else {
          setStates([])
        }

        setLoading(false)
        // ──────────────────────────────────────────────────────

        setTimeout(() => {
          if (cardRef.current) {
            const cardHeight = cardRef.current.offsetHeight
            setPosition((prev) => ({
              ...prev,
              top: rect.top + scrollY - cardHeight - 8,
            }))
          }
        }, 0)
      }, 400)
    }

    function handleHoverOut() {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      hideTimerRef.current = setTimeout(() => {
        setVisible(false)
        setEntity(null)
        setStates([])
      }, 200)
    }

    document.addEventListener('wikilink:hover', handleHover)
    document.addEventListener('wikilink:hoverout', handleHoverOut)
    return () => {
      document.removeEventListener('wikilink:hover', handleHover)
      document.removeEventListener('wikilink:hoverout', handleHoverOut)
    }
  }, [projectId, branchId, activeDocumentOrderIndex, getActiveStatesForEntity, supabase])

  function handleCardMouseEnter() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
  }

  function handleCardMouseLeave() {
    hideTimerRef.current = setTimeout(() => {
      setVisible(false)
      setEntity(null)
      setStates([])
    }, 150)
  }

  if (!visible) return null

  const quickFacts = (entity?.metadata as Record<string, string> | null) ?? {}
  const colorClass = entity ? TYPE_COLORS[entity.type] : 'text-stone-400 bg-stone-50'

  return (
    <div
      ref={cardRef}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
      className="fixed z-50 w-64 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden pointer-events-auto"
    >
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={16} className="text-stone-300 animate-spin" />
        </div>
      )}

      {!loading && !entity && (
        <div className="px-4 py-3">
          <p className="text-xs text-stone-400 font-['Inter']">Entity not found</p>
        </div>
      )}

      {!loading && entity && (
        <>
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-md ${colorClass}`}>
                {TYPE_ICONS[entity.type]}
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-800 font-['Inter'] leading-tight">
                  {entity.title}
                </p>
                <p className={`text-xs capitalize font-['Inter'] ${colorClass.split(' ')[0]}`}>
                  {entity.type}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/project/${projectId}/entity/${entity.id}`)}
              className="p-1 text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <ExternalLink size={12} />
            </button>
          </div>

          {/* Quick facts */}
          {Object.keys(quickFacts).length > 0 && (
            <div className="px-4 pb-2 border-t border-stone-100 pt-2 space-y-1">
              {Object.entries(quickFacts).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-xs text-stone-400 font-['Inter'] w-20 flex-shrink-0 capitalize">
                    {key}
                  </span>
                  <span className="text-xs text-stone-600 font-['Inter'] truncate">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* States section */}
          {states.length > 0 && (
            <div className="px-4 pb-3 border-t border-stone-100 pt-2 space-y-1.5">
              {states.map((state) => (
                <div key={state.id} className="flex items-start gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                    style={{ background: state.mark_labels?.color ?? '#a8a29e' }}
                  />
                  <div className="min-w-0">
                    <span
                      className="text-xs font-medium font-['Inter'] capitalize"
                      style={{ color: state.mark_labels?.color ?? '#a8a29e' }}
                    >
                      {state.mark_labels?.name ?? 'Unknown'}
                    </span>
                    {state.note && (
                      <p className="text-xs text-stone-400 font-['Inter'] truncate">
                        {state.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback */}
          {Object.keys(quickFacts).length === 0 && states.length === 0 && (
            <div className="px-4 pb-3 border-t border-stone-100 pt-2">
              <p className="text-xs text-stone-300 font-['Inter']">
                No quick facts yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}