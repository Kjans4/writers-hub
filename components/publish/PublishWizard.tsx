// components/publish/PublishWizard.tsx
// Phase A update: adds genre_id and tags to WizardData.
// Tags are saved via POST /api/story/[storyId]/tags after story creation.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepDetails from './StepDetails'
import StepCover from './StepCover'
import StepChapters from './StepChapters'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { ContentRating, StoryStatus } from '@/lib/supabase/types'

interface Chapter {
  id:           string
  title:        string
  order_index:  number | null
  is_published: boolean
}

interface PublishWizardProps {
  project:  { id: string; title: string }
  chapters: Chapter[]
}

export interface WizardData {
  title:          string
  hook:           string
  description:    string
  content_rating: ContentRating
  status:         StoryStatus
  cover_url:      string | null
  chapter_ids:    string[]
  genre_id:       string | null  // Phase A
  tags:           string[]       // Phase A
}

const STEPS = ['Story Details', 'Cover Image', 'Publish Chapters']

export default function PublishWizard({ project, chapters }: PublishWizardProps) {
  const router = useRouter()

  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const [data, setData] = useState<WizardData>({
    title:          project.title,
    hook:           '',
    description:    '',
    content_rating: 'teen',
    status:         'ongoing',
    cover_url:      null,
    chapter_ids:    [],
    genre_id:       null,
    tags:           [],
  })

  function updateData(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  async function handlePublish(finalChapterIds: string[]) {
    setLoading(true)
    setError(null)

    try {
      // 1. Create the published story
      const response = await fetch('/api/publish/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id:     project.id,
          title:          data.title,
          hook:           data.hook,
          description:    data.description,
          cover_url:      data.cover_url,
          content_rating: data.content_rating,
          status:         data.status,
          chapter_ids:    finalChapterIds,
          genre_id:       data.genre_id,
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        setError(json.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }

      // 2. Save tags if any were selected
      if (data.tags.length > 0 && json.story?.id) {
        await fetch(`/api/story/${json.story.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: data.tags }),
        })
      }

      setSuccess(json.story.slug)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-emerald-50 rounded-full">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
          </div>
          <h2 className="font-serif text-2xl text-stone-800 mb-2">Your story is live!</h2>
          <p className="text-stone-400 text-sm font-['Inter'] mb-8">
            Readers can now find{' '}
            <span className="text-stone-600 font-medium">{data.title}</span>.
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 mb-8 flex items-center gap-3">
            <span className="text-xs text-stone-400 font-['Inter'] flex-1 truncate">
              /story/{success}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/story/${success}`)}
              className="text-xs text-amber-600 hover:text-amber-800 font-['Inter'] font-medium flex-shrink-0"
            >
              Copy link
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/story/${success}`)}
              className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
            >
              View story page
            </button>
            <button
              onClick={() => router.push(`/project/${project.id}`)}
              className="flex-1 py-2.5 border border-stone-200 text-stone-600 hover:text-stone-800 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
            >
              Back to editor
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Wizard shell ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">

      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500" />
            <span className="font-serif text-stone-800">Publish Story</span>
          </div>
          <button
            onClick={() => router.push(`/project/${project.id}`)}
            className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-stone-100 bg-white">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const n           = i + 1
              const isActive    = step === n
              const isCompleted = step > n
              return (
                <div key={n} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`
                      w-5 h-5 rounded-full text-xs font-medium flex items-center justify-center
                      font-['Inter'] transition-colors
                      ${isActive    ? 'bg-stone-800 text-white'   : ''}
                      ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-stone-100 text-stone-400' : ''}
                    `}>
                      {isCompleted ? '✓' : n}
                    </span>
                    <span className={`text-xs font-['Inter'] hidden sm:block ${isActive ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className="w-6 h-px bg-stone-200 mx-1" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col">
        <div className="max-w-lg mx-auto w-full px-6 py-10 flex-1">

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-['Inter']">{error}</p>
            </div>
          )}

          {step === 1 && (
            <StepDetails
              data={data}
              onChange={updateData}
              onNext={() => setStep(2)}
              onCancel={() => router.push(`/project/${project.id}`)}
            />
          )}
          {step === 2 && (
            <StepCover
              projectId={project.id}
              coverUrl={data.cover_url}
              onCoverChange={(url) => updateData({ cover_url: url })}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepChapters
              chapters={chapters}
              selectedIds={data.chapter_ids}
              onChange={(ids) => updateData({ chapter_ids: ids })}
              onPublish={handlePublish}
              onBack={() => setStep(2)}
              loading={loading}
            />
          )}
        </div>
      </main>
    </div>
  )
}