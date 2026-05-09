// app/(app)/dashboard/page.tsx
// Project dashboard. Lists all projects for the signed-in user.
// Supports: create project (modal), delete project, navigate into project.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/lib/supabase/types'
import { Plus, BookOpen, Trash2, LogOut, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // New project modal state
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Load projects ─────────────────────────────────────────
  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (!error && data) setProjects(data as Project[])
      setLoading(false)
    }
    loadProjects()
  }, [])

  // ── Create project ────────────────────────────────────────
  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // 1. Insert the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      })
      .select()
      .single()

    if (projectError || !project) {
      setSaving(false)
      return
    }

    // 2. Create the default Canon branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        project_id: project.id,
        name: 'Canon',
        is_canon: true,
      })
      .select()
      .single()

    if (branchError || !branch) {
      setSaving(false)
      return
    }

    setSaving(false)
    setShowModal(false)
    setNewTitle('')
    setNewDescription('')

    // Navigate straight into the project
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

  // ── Format date ───────────────────────────────────────────
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

        {/* Header row */}
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="text-stone-300 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 font-['Inter'] text-sm">
              Create your first project to get started.
            </p>
          </div>
        )}

        {/* Project grid */}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeletingId(project.id)
                  }}
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
                <p className="text-stone-300 text-xs font-['Inter'] mt-auto">
                  {formatDate(project.updated_at)}
                </p>
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
            <h3 className="font-serif text-xl text-stone-800 mb-5">
              New project
            </h3>

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
                onClick={() => {
                  setShowModal(false)
                  setNewTitle('')
                  setNewDescription('')
                }}
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
            <h3 className="font-serif text-lg text-stone-800 mb-2">
              Delete project?
            </h3>
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