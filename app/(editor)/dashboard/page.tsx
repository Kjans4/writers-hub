// app/(editor)/dashboard/page.tsx
// Updated: each project card now shows a total word count derived from all
// Canon chapter documents. Words are counted server-side by stripping HTML
// tags from documents.content and splitting on whitespace — no extra DB
// columns or API routes needed.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/lib/supabase/types'
import { Plus, BookOpen, Trash2, LogOut, Loader2 } from 'lucide-react'

// Strip HTML tags and count words — mirrors the logic in useWordCount but
// runs on stored HTML strings rather than a live ProseMirror document.
function countWordsFromHtml(html: string | null): number {
  if (!html) return 0
  // Remove all HTML tags, decode basic entities, split on whitespace
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return text.trim().split(/\s+/).filter(Boolean).length
}

function formatWordCount(n: number): string {
  if (n === 0) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k words`
  return `${n.toLocaleString()} words`
}

interface ProjectWithWordCount extends Project {
  wordCount: number
}

export default function DashboardPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectWithWordCount[]>([])
  const [loading, setLoading]   = useState(true)

  const [showModal, setShowModal]           = useState(false)
  const [newTitle, setNewTitle]             = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving]                 = useState(false)
  const [deletingId, setDeletingId]         = useState<string | null>(null)

  // ── Load projects + word counts ───────────────────────────
  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error || !data) {
        setLoading(false)
        return
      }

      // For each project, fetch the Canon branch then sum words across chapters
      const withCounts = await Promise.all(
        (data as Project[]).map(async (project) => {
          try {
            // 1. Find the Canon branch
            const { data: branch } = await supabase
              .from('branches')
              .select('id')
              .eq('project_id', project.id)
              .eq('is_canon', true)
              .single()

            if (!branch) return { ...project, wordCount: 0 }

            // 2. Fetch content of all chapters on Canon
            const { data: chapters } = await supabase
              .from('documents')
              .select('content')
              .eq('project_id', project.id)
              .eq('branch_id', branch.id)
              .eq('type', 'chapter')

            const total = (chapters ?? []).reduce(
              (sum, ch) => sum + countWordsFromHtml(ch.content),
              0
            )

            return { ...project, wordCount: total }
          } catch {
            return { ...project, wordCount: 0 }
          }
        })
      )

      setProjects(withCounts)
      setLoading(false)
    }

    loadProjects()
  }, [])

  // ── Create project ────────────────────────────────────────
  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id:     user.id,
        title:       newTitle.trim(),
        description: newDescription.trim() || null,
      })
      .select()
      .single()

    if (projectError || !project) { setSaving(false); return }

    const { error: branchError } = await supabase
      .from('branches')
      .insert({ project_id: project.id, name: 'Canon', is_canon: true })

    if (branchError) { setSaving(false); return }

    setSaving(false)
    setShowModal(false)
    setNewTitle('')
    setNewDescription('')
    router.push(`/project/${project.id}`)
  }

  // ── Delete project ────────────────────────────────────────
  async function handleDelete(projectId: string) {
    await supabase.from('projects').delete().eq('id', projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setDeletingId(null)
  }

  // ── Sign out ──────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">

      {/* ── Top nav ─────────────────────────────────────── */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-serif text-xl text-stone-800 tracking-tight">
            Writer's Hub
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-['Inter'] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl text-stone-800">Your Projects</h2>
            <p className="text-stone-400 text-sm mt-0.5 font-['Inter']">
              {projects.length === 0
                ? 'No stories yet'
                : `${projects.length} ${projects.length === 1 ? 'story' : 'stories'}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
          >
            <Plus size={15} />
            New project
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="text-stone-300 animate-spin" />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 font-['Inter'] text-sm">
              Create your first project to get started.
            </p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletingId(project.id) }}
                  className="absolute top-3 right-3 p-1.5 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                >
                  <Trash2 size={13} />
                </button>

                <BookOpen size={18} className="text-amber-500 mb-3" />
                <h3 className="font-serif text-base text-stone-800 leading-snug mb-1">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="text-stone-400 text-xs font-['Inter'] line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                {/* Footer row — date + word count */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <p className="text-stone-300 text-xs font-['Inter']">
                    {formatDate(project.updated_at)}
                  </p>
                  {project.wordCount > 0 && (
                    <p className="text-xs font-['Inter'] text-stone-400 tabular-nums">
                      {formatWordCount(project.wordCount)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Create project modal ─────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-xl text-stone-800 mb-5">New project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                  placeholder="The Name of the Wind"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5 font-['Inter']">
                  Description{' '}
                  <span className="normal-case text-stone-300">(optional)</span>
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all resize-none"
                  placeholder="A brief note about the story…"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setNewTitle(''); setNewDescription('') }}
                className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || saving}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────── */}
      {deletingId && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg text-stone-800 mb-2">Delete project?</h3>
            <p className="text-stone-400 text-sm font-['Inter'] mb-6">
              This will permanently delete the project and all its chapters,
              entities, and history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}