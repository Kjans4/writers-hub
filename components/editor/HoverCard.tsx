// components/editor/HoverCard.tsx
// Hover card shown 400ms after hovering a wikilink node.
// Listens to "wikilink:hover" and "wikilink:hoverout" DOM events.
// Fetches entity metadata from Supabase and displays Quick Facts.
// Never blocks the current writing line — always appears above the wikilink.

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Document, DocumentType } from '@/lib/supabase/types'
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

  const [entity, setEntity] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // ── Listen for hover events ───────────────────────────────
  useEffect(() => {
    async function handleHover(e: Event) {
      const { title, rect } = (e as CustomEvent).detail as {
        title: string
        rect: DOMRect
      }

      // Clear any pending hide
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

      // Show after 400ms delay
      showTimerRef.current = setTimeout(async () => {
        setLoading(true)
        setVisible(true)

        // Position: above the wikilink, left-aligned
        const cardWidth = 260
        const scrollY = window.scrollY
        setPosition({
          top: rect.top + scrollY - 8,
          left: Math.max(
            8,
            Math.min(rect.left, window.innerWidth - cardWidth - 8)
          ),
        })

        // Fetch entity
        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .eq('branch_id', branchId)
          .eq('title', title)
          .single()

        setEntity(data as Document | null)
        setLoading(false)

        // Reposition above after we know card height
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

      // Small grace period — lets mouse move to the card itself
      hideTimerRef.current = setTimeout(() => {
        setVisible(false)
        setEntity(null)
      }, 200)
    }

    document.addEventListener('wikilink:hover', handleHover)
    document.addEventListener('wikilink:hoverout', handleHoverOut)

    return () => {
      document.removeEventListener('wikilink:hover', handleHover)
      document.removeEventListener('wikilink:hoverout', handleHoverOut)
    }
  }, [projectId, branchId])

  // ── Keep card visible while mouse is over it ──────────────
  function handleCardMouseEnter() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
  }

  function handleCardMouseLeave() {
    hideTimerRef.current = setTimeout(() => {
      setVisible(false)
      setEntity(null)
    }, 150)
  }

  if (!visible) return null

  // Parse quick facts from metadata
  const quickFacts: Record<string, string> =
    (entity?.metadata as Record<string, string> | null) ?? {}

  const colorClass =
    entity ? TYPE_COLORS[entity.type] : 'text-stone-400 bg-stone-50'

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
          <p className="text-xs text-stone-400 font-['Inter']">
            Entity not found
          </p>
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

            {/* Navigate to entity page */}
            <button
              onClick={() =>
                router.push(
                  `/project/${projectId}/entity/${entity.id}`
                )
              }
              className="p-1 text-stone-300 hover:text-stone-500 transition-colors shrink-0 mt-0.5"
              title="Open entity page"
            >
              <ExternalLink size={12} />
            </button>
          </div>

          {/* Quick facts */}
          {Object.keys(quickFacts).length > 0 && (
            <div className="px-4 pb-3 border-t border-stone-100 pt-2 space-y-1">
              {Object.entries(quickFacts)
                .slice(0, 4)
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-xs text-stone-400 font-['Inter'] w-20 shrink-0 capitalize">
                      {key}
                    </span>
                    <span className="text-xs text-stone-600 font-['Inter'] truncate">
                      {String(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* No quick facts yet */}
          {Object.keys(quickFacts).length === 0 && (
            <div className="px-4 pb-3 border-t border-stone-100 pt-2">
              <p className="text-xs text-stone-300 font-['Inter']">
                No quick facts yet — add them on the entity page.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}