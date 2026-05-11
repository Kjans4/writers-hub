// components/publish/StepCover.tsx
// Step 2 of the publish wizard.
// Writer uploads a cover image to Supabase Storage.
// Upload fires immediately on file selection.
// Cover URL is held in wizard state; stored in DB only on final publish.
// If no cover is uploaded, cover_url stays null and CoverPlaceholder is used.

'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface StepCoverProps {
  projectId:     string
  coverUrl:      string | null
  onCoverChange: (url: string | null) => void
  onNext:        () => void
  onBack:        () => void
}

export default function StepCover({
  projectId,
  coverUrl,
  onCoverChange,
  onNext,
  onBack,
}: StepCoverProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [dragging, setDragging]   = useState(false)

  async function handleFile(file: File) {
    // Validate type and size
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WebP images are supported.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.')
      return
    }

    setError(null)
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated.')
      setUploading(false)
      return
    }

    const ext      = file.name.split('.').pop()
    const path     = `covers/${user.id}/${projectId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('covers')
      .getPublicUrl(path)

    onCoverChange(urlData.publicUrl)
    setUploading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onCoverChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-7">

      <div>
        <h2 className="font-serif text-xl text-stone-800 mb-1">
          Cover Image
        </h2>
        <p className="text-sm text-stone-400 font-['Inter']">
          A cover helps readers find your story. You can skip this and add one later.
        </p>
      </div>

      {/* Upload area */}
      {!coverUrl ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center
            border-2 border-dashed rounded-xl cursor-pointer
            transition-colors py-14 px-8
            ${dragging
              ? 'border-amber-400 bg-amber-50'
              : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />

          {uploading ? (
            <Loader2 size={28} className="text-stone-300 animate-spin mb-3" />
          ) : (
            <Upload size={28} className="text-stone-300 mb-3" />
          )}

          <p className="text-sm text-stone-500 font-['Inter'] font-medium mb-1">
            {uploading ? 'Uploading…' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-stone-400 font-['Inter']">
            Recommended 400×600px · JPG, PNG, or WebP · Max 2MB
          </p>
        </div>
      ) : (
        /* Preview */
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt="Cover preview"
              className="w-32 h-48 object-cover rounded-xl border border-stone-200 shadow-sm"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-red-400 hover:border-red-200 transition-colors shadow-sm"
            >
              <X size={12} />
            </button>
          </div>
          <div className="pt-2">
            <p className="text-sm text-stone-700 font-['Inter'] font-medium mb-1">
              Cover uploaded
            </p>
            <p className="text-xs text-stone-400 font-['Inter'] mb-4">
              Readers will see this on your story card and story page.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-amber-600 hover:text-amber-800 font-['Inter'] underline underline-offset-2 transition-colors"
            >
              Change image
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 font-['Inter'] bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* No cover note */}
      {!coverUrl && !uploading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg border border-stone-100">
          <ImageIcon size={13} className="text-stone-300 flex-shrink-0" />
          <p className="text-xs text-stone-400 font-['Inter']">
            No cover? We'll show a generated placeholder in the feed.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-lg font-['Inter'] transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={uploading}
          className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}