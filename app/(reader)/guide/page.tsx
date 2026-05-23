// app/(reader)/guide/page.tsx
// Guide index — lists all available guides.
// Uses the standalone GuideHeader (no ReaderNav).

import { getAllGuides } from '@/lib/guides'
import GuideCard from '@/components/guide/GuideCard'
import GuideHeader from '@/components/guide/GuideHeader'
import { BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Guides — Writer\'s Hub',
  description: 'Learn how to use Writer\'s Hub to write, organize, and publish your story.',
}

export default function GuidesIndexPage() {
  const guides = getAllGuides()

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <GuideHeader title="Guides" />

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
            <BookOpen size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-stone-800">
              How Writer's Hub works
            </h1>
          </div>
        </div>

        <p className="text-stone-400 font-['Inter'] text-sm leading-relaxed mb-10 ml-14">
          Three short guides covering navigation, the editor, and the world-building system.
          Read them in order or jump to what you need.
        </p>

        {/* Guide cards */}
        <div className="flex flex-col gap-4">
          {guides.map((guide, i) => (
            <div key={guide.slug} className="flex gap-4 items-start">
              {/* Step number */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-semibold text-stone-500 font-['Inter']">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <GuideCard {...guide} />
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}