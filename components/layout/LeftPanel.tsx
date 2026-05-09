// components/layout/LeftPanel.tsx
// Left sidebar panel showing chapter list and world-building entities.
// Supports: create chapter, navigate to chapter, navigate to entity pages (Phase 3).
// Sections: Chapters, Characters, Locations, Lore, Objects.

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/store/editorStore'
import { Document, DocumentType } from '@/lib/supabase/types'
import {
  BookOpen,
  User,
  MapPin,
  Scroll,
  Package,
  Plus,
  ChevronDown,
  ChevronRight,
  Home,
  Loader2,
} from 'lucide-react'

interface LeftPanelProps {
  projectId: string
}

// Section config for world-building entity types
const ENTITY_SECTIONS: { type: DocumentType; label: string; icon: React.ReactNode }[] = [
  { type: 'character', label: 'Characters', icon: <User size={12} /> },
  { type: 'location',  label: 'Locations',  icon: <MapPin size={12} /> },
  { type: 'lore',      label: 'Lore',       icon: <Scroll size={12} /> },
  { type: 'object',    label: 'Objects',    icon: <Package size={12} /> },
]

export default function LeftPanel({ projectId }: LeftPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const { activeBranchId, setActiveBranch, setActiveDocument } = useEditorStore()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  // Collapsed state per section
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    chapters: false,
    character: true,
    location: true,
    lore: true,
    object: true,
  })

  // Creating state per type
  const [creatingType, setCreatingType] = useState<DocumentType | 'chapter' | null>(null)
  const [newTitle, setNewTitle] = useState('')

  // ── Load canon branch + documents ─────────────────────────
  useEffect(() => {
    async function load() {
      // Find the canon branch for this project
      const { data: branch } = await supabase
        .from('branches')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_canon', true)
        .single()

      if (!branch) {
        setLoading(false)
        return
      }

      setActiveBranch(branch.id)

      // Load all documents for this branch
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_id', branch.id)
        .order('order_index', { ascending: true })

      if (docs) setDocuments(docs as Document[])
      setLoading(false)
    }

    load()
  }, [projectId])

  // ── Toggle section collapsed ───────────────────────────────
  function toggleSection(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ── Create a new document ──────────────────────────────────
  async function handleCreate(type: DocumentType | 'chapter') {
    if (!newTitle.trim() || !activeBranchId) return

    const docType: DocumentType = type === 'chapter' ? 'chapter' : type

    // Get current max order_index for this type
    const sameType = documents.filter((d) => d.type === docType)
    const nextOrder = sameType.length > 0
      ? Math.max(...sameType.map((d) => d.order_index ?? 0)) + 1
      : 0

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        branch_id: activeBranchId,
        type: docType,
        title: newTitle.trim(),
        content: '',
        order_index: nextOrder,
      })
      .select()
      .single()

    if (error || !doc) return

    setDocuments((prev) => [...prev, doc as Document])
    setNewTitle('')
    setCreatingType(null)

    // Navigate to the new document
    if (docType === 'chapter') {
      router.push(`/project/${projectId}/chapter/${doc.id}`)
    } else {
      router.push(`/project/${projectId}/entity/${doc.id}`)
    }
  }

  // ── Is a path active ───────────────────────────────────────
  function isActive(docId: string) {
    return pathname.includes(docId)
  }

  // ── Render a tree item ─────────────────────────────────────
  function renderItem(doc: Document, href: string) {
    return (
      <button
        key={doc.id}
        onClick={() => {
          setActiveDocument(doc.id)
          router.push(href)
        }}
        className={`
          w-full text-left px-3 py-1.5 rounded-md text-xs font-['Inter']
          truncate transition-colors
          ${isActive(doc.id)
            ? 'bg-amber-50 text-amber-800 font-medium'
            : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'}
        `}
      >
        {doc.title}
      </button>
    )
  }

  // ── Render an inline create input ─────────────────────────
  function renderCreateInput(type: DocumentType | 'chapter') {
    return (
      <div className="px-2 py-1">
        <input
          autoFocus
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate(type)
            if (e.key === 'Escape') {
              setCreatingType(null)
              setNewTitle('')
            }
          }}
          onBlur={() => {
            if (!newTitle.trim()) {
              setCreatingType(null)
              setNewTitle('')
            }
          }}
          placeholder="Title…"
          className="w-full px-2 py-1 text-xs font-['Inter'] bg-stone-50 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 text-stone-700 placeholder:text-stone-300"
        />
      </div>
    )
  }

  const chapters = documents.filter((d) => d.type === 'chapter')

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Panel header ──────────────────────────────── */}
      <div className="px-3 h-11 flex items-center border-b border-stone-100 flex-shrink-0">
        <button
          onClick={() => router.push(`/project/${projectId}`)}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Home size={13} />
          <span className="text-xs font-['Inter']">Project</span>
        </button>
      </div>

      {/* ── Scrollable tree ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="text-stone-300 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── Chapters section ──────────────────── */}
            <div className="mb-1">
              <div className="flex items-center justify-between px-1 py-1 group">
                <button
                  onClick={() => toggleSection('chapters')}
                  className="flex items-center gap-1 text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] hover:text-stone-600 transition-colors"
                >
                  {collapsed.chapters
                    ? <ChevronRight size={11} />
                    : <ChevronDown size={11} />
                  }
                  <BookOpen size={11} />
                  Chapters
                </button>
                <button
                  onClick={() => {
                    setCollapsed((p) => ({ ...p, chapters: false }))
                    setCreatingType('chapter')
                    setNewTitle('')
                  }}
                  className="p-0.5 text-stone-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Plus size={13} />
                </button>
              </div>

              {!collapsed.chapters && (
                <div className="space-y-0.5 mt-0.5">
                  {chapters.map((doc) =>
                    renderItem(doc, `/project/${projectId}/chapter/${doc.id}`)
                  )}
                  {creatingType === 'chapter' && renderCreateInput('chapter')}
                  {chapters.length === 0 && creatingType !== 'chapter' && (
                    <p className="px-3 py-1 text-xs text-stone-300 font-['Inter']">
                      No chapters yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Entity sections ────────────────────── */}
            {ENTITY_SECTIONS.map(({ type, label, icon }) => {
              const entities = documents.filter((d) => d.type === type)
              return (
                <div key={type} className="mb-1">
                  <div className="flex items-center justify-between px-1 py-1 group">
                    <button
                      onClick={() => toggleSection(type)}
                      className="flex items-center gap-1 text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] hover:text-stone-600 transition-colors"
                    >
                      {collapsed[type]
                        ? <ChevronRight size={11} />
                        : <ChevronDown size={11} />
                      }
                      {icon}
                      {label}
                    </button>
                    <button
                      onClick={() => {
                        setCollapsed((p) => ({ ...p, [type]: false }))
                        setCreatingType(type)
                        setNewTitle('')
                      }}
                      className="p-0.5 text-stone-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {!collapsed[type] && (
                    <div className="space-y-0.5 mt-0.5">
                      {entities.map((doc) =>
                        renderItem(doc, `/project/${projectId}/entity/${doc.id}`)
                      )}
                      {creatingType === type && renderCreateInput(type)}
                      {entities.length === 0 && creatingType !== type && (
                        <p className="px-3 py-1 text-xs text-stone-300 font-['Inter']">
                          None yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}