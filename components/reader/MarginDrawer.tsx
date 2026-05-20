// components/reader/MarginDrawer.tsx
// Slide-in drawer from the right showing the flat comment thread for a paragraph.
//
// Shows:
//   - The passage (selected_text from the first comment) at the top
//   - Stale warning if any comment in the thread is stale
//   - Comments sorted by appreciation count (most-loved first)
//   - Appreciation hearts — toggle per comment
//   - Own comment: Edit / Delete (soft-delete)
//   - Post new comment from the drawer bottom (only if user hasn't already
//     commented on this paragraph — enforced by UNIQUE constraint)
//   - Load more (pagination: 20/page)
//   - Close button (×)
//
// Props:
//   documentId      — chapter document UUID
//   paragraphKey    — stable UUID from data-paragraph-key
//   isLoggedIn      — controls whether post/appreciate actions are available
//   onClose         — called when × is clicked or backdrop is tapped
//   onBubbleUpdate  — called after post/delete so MarginBubbleLayer can re-fetch

'use client'

import { useEffect, useRef, useState } from 'react'
import {
  X, Heart, Loader2, AlertTriangle, Send, RotateCcw, Trash2,
} from 'lucide-react'

interface CommentItem {
  id: string
  user_id: string
  author_name: string
  author_avatar: string | null
  content: string
  appreciation_count: number
  appreciated_by_me: boolean
  is_mine: boolean
  created_at: string
}

interface ThreadData {
  paragraph_key: string
  selected_text: string
  is_stale: boolean
  comments: CommentItem[]
  total: number
  has_more: boolean
}

interface MarginDrawerProps {
  documentId:     string
  paragraphKey:   string
  isLoggedIn:     boolean
  onClose:        () => void
  onBubbleUpdate: () => void
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const now  = Date.now()
  const diff = now - date.getTime()

  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MarginDrawer({
  documentId,
  paragraphKey,
  isLoggedIn,
  onClose,
  onBubbleUpdate,
}: MarginDrawerProps) {
  const [thread, setThread]         = useState<ThreadData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage]             = useState(1)

  // New comment compose state
  const [newContent, setNewContent] = useState('')
  const [posting, setPosting]       = useState(false)
  const [postError, setPostError]   = useState<string | null>(null)
  const [alreadyPosted, setAlreadyPosted] = useState(false)

  // Edit state
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving]         = useState(false)

  // Appreciation in-flight
  const [appreciating, setAppreciating] = useState<Set<string>>(new Set())

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Load thread ───────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setPage(1)
    loadThread(1, true)
  }, [documentId, paragraphKey])

  async function loadThread(pageNum: number, replace: boolean) {
    try {
      const res = await fetch(
        `/api/annotations/inline-comments/${documentId}/${paragraphKey}?page=${pageNum}`
      )
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data: ThreadData = await res.json()

      // Check if the current user has already commented on this paragraph
      const mine = data.comments.find(c => c.is_mine)
      setAlreadyPosted(!!mine)

      setThread(prev => {
        if (replace || !prev) return data
        return {
          ...data,
          comments: [...prev.comments, ...data.comments],
        }
      })
    } catch {
      // Non-fatal
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    setLoadingMore(true)
    loadThread(next, false)
  }

  // ── Post new comment ──────────────────────────────────────
  async function handlePost() {
    if (!newContent.trim() || posting) return
    setPosting(true)
    setPostError(null)

    try {
      // We need an anchor to POST — for the drawer, we use a synthetic
      // anchor covering the whole paragraph (offsets 0,0 with the
      // selected_text from the first comment, or a generic placeholder).
      // In practice the "post from drawer" path is for readers who didn't
      // select text but want to react to the whole passage.
      const selectedText = thread?.selected_text ?? ''

      const res = await fetch('/api/annotations/inline-comments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          document_id:   documentId,
          paragraph_key: paragraphKey,
          start_offset:  0,
          end_offset:    selectedText.length || 1,
          selected_text: selectedText || '(full paragraph)',
          content:       newContent.trim(),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setPostError(json.error ?? 'Something went wrong.')
        return
      }

      setNewContent('')
      setAlreadyPosted(true)
      onBubbleUpdate()
      // Reload the thread to pick up the new comment + sorted correctly
      loadThread(1, true)
    } catch {
      setPostError('Network error. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  // ── Appreciate toggle ─────────────────────────────────────
  async function handleAppreciate(comment: CommentItem) {
    if (!isLoggedIn || appreciating.has(comment.id)) return

    setAppreciating(prev => new Set(prev).add(comment.id))

    // Optimistic update
    setThread(prev => {
      if (!prev) return prev
      return {
        ...prev,
        comments: prev.comments.map(c =>
          c.id === comment.id
            ? {
                ...c,
                appreciated_by_me:  !c.appreciated_by_me,
                appreciation_count: c.appreciated_by_me
                  ? c.appreciation_count - 1
                  : c.appreciation_count + 1,
              }
            : c
        ),
      }
    })

    try {
      await fetch(`/api/annotations/inline-comments/${comment.id}/appreciate`, {
        method: 'POST',
      })
    } catch {
      // Revert on failure — reload
      loadThread(1, true)
    } finally {
      setAppreciating(prev => {
        const next = new Set(prev)
        next.delete(comment.id)
        return next
      })
    }
  }

  // ── Edit comment ──────────────────────────────────────────
  async function handleEdit(comment: CommentItem) {
    if (!editContent.trim() || saving) return
    setSaving(true)

    try {
      const res = await fetch(`/api/annotations/inline-comments/${comment.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: editContent.trim() }),
      })

      if (!res.ok) return

      setThread(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.map(c =>
            c.id === comment.id ? { ...c, content: editContent.trim() } : c
          ),
        }
      })
      setEditingId(null)
    } catch {
      // Silent
    } finally {
      setSaving(false)
    }
  }

  // ── Soft-delete comment ───────────────────────────────────
  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(
        `/api/annotations/inline-comments/${commentId}/delete`,
        { method: 'POST' }
      )
      if (!res.ok) return

      setThread(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId),
          total:    prev.total - 1,
        }
      })
      setAlreadyPosted(false)
      onBubbleUpdate()
    } catch {
      // Silent
    }
  }

  const MAX_CHARS = 280
  const remaining = MAX_CHARS - newContent.length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-stone-200 shadow-xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100 flex-shrink-0">
          <h3 className="text-sm font-semibold text-stone-700 font-['Inter']">
            Reader Reactions
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors rounded"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={16} className="text-stone-300 animate-spin" />
            </div>
          )}

          {!loading && thread && (
            <>
              {/* Passage preview */}
              {thread.selected_text && (
                <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60">
                  <p className="font-serif text-sm text-stone-500 italic leading-relaxed line-clamp-3">
                    "{thread.selected_text}"
                  </p>
                  {thread.is_stale && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <AlertTriangle size={11} className="text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-600 font-['Inter']">
                        This passage may have changed since these reactions were saved.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {thread.comments.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-stone-400 font-['Inter']">
                    No reactions yet on this passage.
                  </p>
                </div>
              )}

              {/* Comment list */}
              {thread.comments.length > 0 && (
                <div className="divide-y divide-stone-50">
                  {thread.comments.map(comment => (
                    <div key={comment.id} className="px-4 py-4 group">

                      {/* Author row */}
                      <div className="flex items-center gap-2 mb-2">
                        {comment.author_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={comment.author_avatar}
                            alt={comment.author_name}
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-stone-500 font-semibold font-['Inter']">
                              {comment.author_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-xs font-medium text-stone-700 font-['Inter'] flex-1 truncate">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-stone-300 font-['Inter'] flex-shrink-0">
                          {formatTime(comment.created_at)}
                        </span>
                      </div>

                      {/* Content or edit field */}
                      {editingId === comment.id ? (
                        <div className="space-y-2 mb-2">
                          <textarea
                            autoFocus
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Escape') setEditingId(null)
                              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault()
                                handleEdit(comment)
                              }
                            }}
                            rows={3}
                            maxLength={MAX_CHARS}
                            className="w-full text-sm font-['Inter'] text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-stone-300 font-['Inter']">
                              {MAX_CHARS - editContent.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEdit(comment)}
                                disabled={!editContent.trim() || saving}
                                className="flex items-center gap-1 text-xs font-medium font-['Inter'] px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors disabled:opacity-40"
                              >
                                {saving
                                  ? <Loader2 size={10} className="animate-spin" />
                                  : null}
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-['Inter'] text-stone-700 leading-relaxed mb-2">
                          {comment.content}
                        </p>
                      )}

                      {/* Actions row */}
                      {editingId !== comment.id && (
                        <div className="flex items-center gap-3">
                          {/* Appreciate */}
                          <button
                            onClick={() => handleAppreciate(comment)}
                            disabled={!isLoggedIn || appreciating.has(comment.id)}
                            className={`
                              flex items-center gap-1 text-xs font-['Inter'] transition-colors
                              ${comment.appreciated_by_me
                                ? 'text-red-400 hover:text-red-500'
                                : 'text-stone-300 hover:text-red-400'}
                              disabled:opacity-40 disabled:cursor-not-allowed
                            `}
                            title={isLoggedIn ? 'Appreciate' : 'Log in to appreciate'}
                          >
                            <Heart
                              size={12}
                              className={comment.appreciated_by_me ? 'fill-current' : ''}
                            />
                            {comment.appreciation_count > 0 && (
                              <span>{comment.appreciation_count}</span>
                            )}
                          </button>

                          {/* Own comment: edit + delete */}
                          {comment.is_mine && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(comment.id)
                                  setEditContent(comment.content)
                                }}
                                className="text-xs text-stone-300 hover:text-stone-500 font-['Inter'] transition-colors opacity-0 group-hover:opacity-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="flex items-center gap-0.5 text-xs text-stone-300 hover:text-red-400 font-['Inter'] transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={10} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load more */}
                  {thread.has_more && (
                    <div className="px-4 py-3">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors flex items-center justify-center gap-1.5 py-1.5"
                      >
                        {loadingMore
                          ? <Loader2 size={11} className="animate-spin" />
                          : null}
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — compose area */}
        <div className="flex-shrink-0 border-t border-stone-100">
          {!isLoggedIn ? (
            <div className="px-4 py-3">
              <p className="text-xs text-stone-400 font-['Inter'] text-center">
                <a href="/login" className="text-amber-600 hover:text-amber-800 underline underline-offset-2">
                  Log in
                </a>
                {' '}to join the conversation
              </p>
            </div>
          ) : alreadyPosted ? (
            <div className="px-4 py-3">
              <p className="text-xs text-stone-300 font-['Inter'] text-center">
                You've already reacted to this passage.
              </p>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              <textarea
                ref={textareaRef}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    handlePost()
                  }
                }}
                placeholder="What hit you about this passage?"
                rows={2}
                maxLength={MAX_CHARS}
                className="w-full text-sm font-['Inter'] text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder:text-stone-300"
              />
              {postError && (
                <p className="text-xs text-red-500 font-['Inter']">{postError}</p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-['Inter'] ${
                    remaining < 20 ? 'text-amber-500' : 'text-stone-300'
                  }`}
                >
                  {remaining}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-300 font-['Inter'] hidden sm:block">
                    ⌘↵
                  </span>
                  <button
                    onClick={handlePost}
                    disabled={!newContent.trim() || newContent.length > MAX_CHARS || posting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {posting
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Send size={11} />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}