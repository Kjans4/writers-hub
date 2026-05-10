// components/entity/EntityPage.tsx
// Page for viewing/editing an entity (character, location, object, or lore).
// Mounted at /project/[projectId]/entity/[entityId].
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useDocument } from '@/lib/hooks/useDocument'
import { useLinks } from '@/lib/hooks/useLinks'
import { useAutosave } from '@/lib/hooks/useAutosave'
import { Document, DocumentType } from '@/lib/supabase/types'
import EntityQuickFacts from './EntityQuickFacts'
import EntityStates from './EntityStates'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  MapPin,
  Scroll,
  Package,
  BookOpen,
  Link2,
  Loader2,
} from 'lucide-react'

interface EntityPageProps {
  entityId: string
  projectId: string
}

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  chapter:   <BookOpen size={14} />,
  character: <User size={14} />,
  location:  <MapPin size={14} />,
  lore:      <Scroll size={14} />,
  object:    <Package size={14} />,
}

const TYPE_COLORS: Record<DocumentType, string> = {
  chapter:   'text-stone-500 bg-stone-100',
  character: 'text-violet-600 bg-violet-50',
  location:  'text-emerald-600 bg-emerald-50',
  lore:      'text-amber-600 bg-amber-50',
  object:    'text-sky-500 bg-sky-50',
}

export default function EntityPage({ entityId, projectId }: EntityPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const { document, loading, updateDocument } = useDocument(entityId)
  const { getAppearsIn, getConnectedTo } = useLinks()

  const [appearsIn, setAppearsIn] = useState<Document[]>([])
  const [connectedTo, setConnectedTo] = useState<Document[]>([])
  const [notesContent, setNotesContent] = useState('')

  // ── Load relationship data ────────────────────────────────
  useEffect(() => {
    if (!entityId) return
    getAppearsIn(entityId).then(setAppearsIn)
    getConnectedTo(entityId).then(setConnectedTo)
  }, [entityId])

  // ── Notes editor (mini TipTap) ────────────────────────────
  const notesEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write notes about this entity…' }),
    ],
    content: document?.content ?? '',
    editorProps: {
      attributes: {
        class:
          'editor-content text-base outline-none min-h-[120px] pb-4',
      },
    },
    onUpdate: ({ editor }) => {
      setNotesContent(editor.getHTML())
    },
  })

  // Sync editor when document loads
  useEffect(() => {
    if (notesEditor && document?.content) {
      notesEditor.commands.setContent(document.content)
      setNotesContent(document.content)
    }
  }, [document?.id])

  // ── Autosave notes ────────────────────────────────────────
  useAutosave({
    content: notesContent,
    onSave: async (content) => {
      await updateDocument({ content })
    },
    delay: 1500,
    enabled: !!notesEditor && !!document,
  })

  // ── Save quick facts ──────────────────────────────────────
  async function handleSaveFacts(facts: Record<string, string>) {
    await supabase
      .from('documents')
      .update({ metadata: facts })
      .eq('id', entityId)
  }

  // ── Save title ────────────────────────────────────────────
  async function handleSaveTitle(title: string) {
    await updateDocument({ title })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={20} className="text-stone-300 animate-spin" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 font-['Inter'] text-sm">
          Entity not found.
        </p>
      </div>
    )
  }

  const colorClass = TYPE_COLORS[document.type]
  const facts = (document.metadata as Record<string, string> | null) ?? {}

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12">

      {/* ── Entity header ──────────────────────────────── */}
      <div className="flex items-start gap-3 mb-8">
        <span className={`p-2 rounded-lg mt-1 flex-shrink-0 ${colorClass}`}>
          {TYPE_ICONS[document.type]}
        </span>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            defaultValue={document.title}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val && val !== document.title) handleSaveTitle(val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="font-serif text-2xl font-bold text-stone-800 bg-transparent border-none outline-none w-full leading-tight placeholder:text-stone-300"
            placeholder="Entity name"
          />
          <span
            className={`text-xs font-medium capitalize font-['Inter'] mt-0.5 inline-block ${colorClass.split(' ')[0]}`}
          >
            {document.type}
          </span>
        </div>
      </div>

      {/* ── Two-column layout: notes + facts ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8 mb-12">
        <div>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3">
            Notes
          </h3>
          <EditorContent editor={notesEditor} />
        </div>

        <div>
          <EntityQuickFacts
            facts={facts}
            onSave={handleSaveFacts}
          />
        </div>
      </div>

      {/* ── ADDED ENTITY STATES ─────────────────────────── */}
      {document && (
        <div className="mb-12">
          <EntityStates
            entityId={entityId}
            projectId={projectId}
            branchId={document.branch_id}
          />
        </div>
      )}

      {/* ── Appears In ────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3 flex items-center gap-1.5">
          <BookOpen size={11} />
          Appears In
        </h3>
        {appearsIn.length === 0 ? (
          <p className="text-xs text-stone-300 font-['Inter']">
            Not mentioned in any chapter yet.
          </p>
        ) : (
          <div className="space-y-1">
            {appearsIn.map((doc) => (
              <button
                key={doc.id}
                onClick={() =>
                  router.push(`/project/${projectId}/chapter/${doc.id}`)
                }
                className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 font-['Inter'] transition-colors group"
              >
                <BookOpen
                  size={12}
                  className="text-stone-300 group-hover:text-stone-500"
                />
                {doc.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Connected To ──────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3 flex items-center gap-1.5">
          <Link2 size={11} />
          Connected To
        </h3>
        {connectedTo.length === 0 ? (
          <p className="text-xs text-stone-300 font-['Inter']">
            No connections yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {connectedTo.map((doc) => (
              <button
                key={doc.id}
                onClick={() =>
                  router.push(`/project/${projectId}/entity/${doc.id}`)
                }
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                  font-['Inter'] transition-colors
                  ${TYPE_COLORS[doc.type]}
                  hover:opacity-80
                `}
              >
                {TYPE_ICONS[doc.type]}
                {doc.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}