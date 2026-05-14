// components/publish/ManagePublishing.tsx
// Phase A update: adds Genre & Tags section.
// Genre is editable via dropdown. Tags are editable with TagInput.
// Changes save on button click — not auto-save.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublishedStory, StoryStatus, Genre } from '@/lib/supabase/types'
import TagInput from '@/components/tag/TagInput'
import {
  Globe, Copy, Check, Loader2, AlertTriangle, ExternalLink, ChevronDown,
} from 'lucide-react'

interface Chapter {
  id:           string
  title:        string
  order_index:  number | null
  is_published: boolean
}

interface ManagePublishingProps {
  project:  { id: string; title: string }
  story:    PublishedStory & { genre_id: string | null }
  chapters: Chapter[]
  initialGenreName?: string | null
  initialTags?:      string[]
}

const STATUS_LABELS: Record<StoryStatus, string> = {
  ongoing:   'Ongoing',
  completed: 'Completed',
  hiatus:    'Hiatus',
}

export default function ManagePublishing({
  project, story, chapters,
  initialGenreName = null,
  initialTags = [],
}: ManagePublishingProps) {
  const router = useRouter()

  const [localChapters,  setLocalChapters]  = useState(chapters)
  const [storyStatus,    setStoryStatus]    = useState<StoryStatus>(story.status)
  const [copied,         setCopied]         = useState(false)
  const [togglingId,     setTogglingId]     = useState<string | null>(null)
  const [statusOpen,     setStatusOpen]     = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false)
  const [unpublishing,   setUnpublishing]   = useState(false)

  // Genre + tags state
  const [genres,       setGenres]       = useState<Genre[]>([])
  const [genreId,      setGenreId]      = useState<string>(story.genre_id ?? '')
  const [tags,         setTags]         = useState<string[]>(initialTags)
  const [savingGenreTags, setSavingGenreTags] = useState(false)
  const [genreTagsSaved,  setGenreTagsSaved]  = useState(false)

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/story/${story.slug}`
    : `/story/${story.slug}`

  useEffect(() => {
    fetch('/api/genres')
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => {})
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleChapter(chapter: Chapter) {
    setTogglingId(chapter.id)
    const method = chapter.is_published ? 'DELETE' : 'POST'
    const res = await fetch(`/api/publish/chapter/${chapter.id}`, { method })
    if (res.ok) {
      setLocalChapters((prev) =>
        prev.map((c) => c.id === chapter.id ? { ...c, is_published: !c.is_published } : c)
      )
    }
    setTogglingId(null)
  }

  async function handleStatusChange(newStatus: StoryStatus) {
    setStatusOpen(false)
    if (newStatus === storyStatus) return
    setUpdatingStatus(true)
    const res = await fetch('/api/publish/story', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story.id, status: newStatus }),
    })
    if (res.ok) setStoryStatus(newStatus)
    setUpdatingStatus(false)
  }

  async function handleUnpublish() {
    setUnpublishing(true)
    const res = await fetch('/api/publish/story', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story.id, is_published: false }),
    })
    if (res.ok) router.push(`/project/${project.id}`)
    setUnpublishing(false)
  }

  async function handleSaveGenreTags() {
    setSavingGenreTags(true)

    // Update genre_id on published_stories
    await fetch('/api/publish/story', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: story.id, genre_id: genreId || null }),
    })

    // Replace tags
    await fetch(`/api/story/${story.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })

    setSavingGenreTags(false)
    setGenreTagsSaved(true)
    setTimeout(() => setGenreTagsSaved(false), 2000)
  }

  const publishedCount = localChapters.filter((c) => c.is_published).length

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-emerald-500" />
            <span className="font-serif text-stone-800 truncate max-w-[200px]">{story.title}</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-['Inter']">
              Live
            </span>
          </div>
          <button
            onClick={() => router.push(`/project/${project.id}`)}
            className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
          >
            ← Back to editor
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-10">

        {/* Public URL */}
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3">
            Public URL
          </h3>
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
            <span className="text-sm text-stone-600 font-['Inter'] flex-1 truncate">{publicUrl}</span>
            <button
              onClick={() => window.open(publicUrl, '_blank')}
              className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-['Inter'] text-stone-600 hover:border-stone-300 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

        {/* Genre & Tags */}
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-4">
            Genre & Tags
          </h3>

          <div className="space-y-4">
            {/* Genre dropdown */}
            <div>
              <label className="block text-xs text-stone-500 font-['Inter'] mb-1.5">Genre</label>
              <div className="relative max-w-xs">
                <select
                  value={genreId}
                  onChange={(e) => setGenreId(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-stone-800 text-sm font-['Inter'] focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 pr-9 cursor-pointer"
                >
                  <option value="">No genre selected</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-stone-500 font-['Inter'] mb-1.5">Tags</label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGenreTags}
                disabled={savingGenreTags}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-50"
              >
                {savingGenreTags && <Loader2 size={13} className="animate-spin" />}
                Save changes
              </button>
              {genreTagsSaved && (
                <span className="text-xs text-emerald-600 font-['Inter'] flex items-center gap-1">
                  <Check size={12} /> Saved
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Story Status */}
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3">
            Story Status
          </h3>
          <div className="relative inline-block">
            <button
              onClick={() => setStatusOpen((o) => !o)}
              disabled={updatingStatus}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm font-['Inter'] text-stone-700 hover:border-stone-300 transition-colors"
            >
              {updatingStatus && <Loader2 size={13} className="animate-spin text-stone-400" />}
              {STATUS_LABELS[storyStatus]}
              <ChevronDown size={13} className="text-stone-400" />
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 overflow-hidden py-1 min-w-[140px]">
                {(Object.keys(STATUS_LABELS) as StoryStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`w-full text-left px-4 py-2 text-sm font-['Inter'] transition-colors ${
                      s === storyStatus
                        ? 'text-stone-800 bg-stone-50 font-medium'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Chapters */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter']">
              Chapters
            </h3>
            <span className="text-xs text-stone-400 font-['Inter']">{publishedCount} published</span>
          </div>

          {localChapters.length === 0 ? (
            <p className="text-sm text-stone-400 font-['Inter']">No chapters yet.</p>
          ) : (
            <div className="space-y-2">
              {localChapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-stone-200 rounded-xl"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${chapter.is_published ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-stone-400 font-['Inter']">Chapter {index + 1}</span>
                    <p className="text-sm text-stone-700 font-['Inter'] truncate">{chapter.title || '[Untitled]'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-['Inter'] ${chapter.is_published ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {chapter.is_published ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={() => toggleChapter(chapter)}
                      disabled={togglingId === chapter.id}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-['Inter'] transition-colors ${
                        chapter.is_published
                          ? 'border-stone-200 text-stone-500 hover:border-red-200 hover:text-red-500'
                          : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                      } disabled:opacity-40`}
                    >
                      {togglingId === chapter.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : chapter.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="border-t border-stone-100 pt-8">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-3">
            Danger Zone
          </h3>
          <div className="border border-red-100 rounded-xl p-4 bg-red-50/50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-700 font-['Inter'] mb-0.5">
                  Unpublish entire story
                </p>
                <p className="text-xs text-stone-500 font-['Inter'] mb-3">
                  Your story will be removed from the feed. Your writing is never deleted.
                </p>
                {!showUnpublishConfirm ? (
                  <button
                    onClick={() => setShowUnpublishConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-700 font-['Inter'] underline underline-offset-2 transition-colors"
                  >
                    Unpublish story
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-600 font-['Inter']">Are you sure?</span>
                    <button
                      onClick={handleUnpublish}
                      disabled={unpublishing}
                      className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-['Inter'] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {unpublishing && <Loader2 size={11} className="animate-spin" />}
                      Yes, unpublish
                    </button>
                    <button
                      onClick={() => setShowUnpublishConfirm(false)}
                      className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}