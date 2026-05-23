// app/(reader)/guide/[slug]/page.tsx
// Renders a single guide from its MDX file.
// Uses next-mdx-remote for MDX rendering.
// Standalone layout — GuideHeader, no ReaderNav.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getGuide, getAllGuides, getAdjacentGuides } from '@/lib/guides'
import GuideHeader from '@/components/guide/GuideHeader'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface GuidePageProps {
  params: { slug: string }
}

// Generate static params for all guides at build time
export async function generateStaticParams() {
  const guides = getAllGuides()
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: GuidePageProps) {
  const guide = getGuide(params.slug)
  if (!guide) return {}
  return {
    title:       `${guide.title} — Writer's Hub Guides`,
    description: guide.description,
  }
}

// MDX component overrides — styled to match the app's design system
const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      className="font-serif text-2xl font-bold text-stone-800 mt-10 mb-4 leading-snug first:mt-0"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="font-serif text-xl font-semibold text-stone-800 mt-8 mb-3 leading-snug"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="font-serif text-lg font-semibold text-stone-700 mt-6 mb-2"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="font-['Inter'] text-[15px] text-stone-600 leading-relaxed mb-4"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-stone-800" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-stone-700" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 space-y-1.5 ml-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 space-y-1.5 ml-4 list-decimal" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li
      className="font-['Inter'] text-[15px] text-stone-600 leading-relaxed flex gap-2 before:content-['–'] before:text-stone-300 before:flex-shrink-0"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="font-mono text-sm bg-stone-100 text-amber-700 px-1.5 py-0.5 rounded border border-stone-200"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-stone-900 text-stone-100 rounded-xl p-4 overflow-x-auto mb-4 text-sm font-mono"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className="border-l-2 border-amber-300 pl-4 my-4 text-stone-500 font-serif italic"
      {...props}
    />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6">
      <table
        className="w-full border-collapse font-['Inter'] text-sm"
        {...props}
      />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="border-b border-stone-200" {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="text-left py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="py-2 px-3 text-stone-600 border-b border-stone-100"
      {...props}
    />
  ),
  hr: () => <hr className="border-stone-200 my-8" />,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-amber-600 underline underline-offset-2 hover:text-amber-800 transition-colors"
      {...props}
    />
  ),
}

export default function GuidePage({ params }: GuidePageProps) {
  const guide = getGuide(params.slug)
  if (!guide) notFound()

  const { prev, next } = getAdjacentGuides(params.slug)

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <GuideHeader title={guide.title} />

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Guide header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
            Guide {guide.order} of 3
          </p>
          <h1 className="font-serif text-3xl font-bold text-stone-800 leading-snug mb-3">
            {guide.title}
          </h1>
          <p className="font-['Inter'] text-stone-400 text-sm leading-relaxed">
            {guide.description}
          </p>
          <div className="mt-6 w-full h-px bg-stone-200" />
        </div>

        {/* MDX content */}
        <article>
          <MDXRemote source={guide.content} components={mdxComponents} />
        </article>

        {/* Prev / next navigation */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/guide/${prev.slug}`}
              className="group flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Previous</p>
                <p className="font-medium">{prev.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/guide/${next.slug}`}
              className="group flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors text-right"
            >
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Next</p>
                <p className="font-medium">{next.title}</p>
              </div>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Back to all guides */}
        <div className="mt-8 text-center">
          <Link
            href="/guide"
            className="text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
          >
            ← All guides
          </Link>
        </div>

      </main>
    </div>
  )
}