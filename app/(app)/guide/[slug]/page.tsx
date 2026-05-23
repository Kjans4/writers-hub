// app/(app)/guide/[slug]/page.tsx
// Renders a single guide from its .md file using react-markdown.
// Reads content from content/guides/[slug].md via lib/guides.ts.
// Protected by (app) layout — requires login.
// Features: styled markdown components, prev/next navigation, back link.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { getGuide, getAllGuides, getAdjacentGuides } from '@/lib/guides'
import GuideHeader from '@/components/guide/GuideHeader'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface GuidePageProps {
  params: { slug: string }
}

// Pre-generate all guide routes at build time
export async function generateStaticParams() {
  const guides = getAllGuides()
  return guides.map((g) => ({ slug: g.slug }))
}

// Dynamic metadata per guide
export async function generateMetadata({ params }: GuidePageProps) {
  const guide = getGuide(params.slug)
  if (!guide) return {}
  return {
    title:       `${guide.title} — Writer's Hub`,
    description: guide.description,
  }
}

// ── Markdown component overrides ──────────────────────────────
// Styled to match the app's design system (stone palette, Lora serif, Inter sans)
const mdComponents = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="font-serif text-2xl font-bold text-stone-800 mt-10 mb-4 leading-snug first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-serif text-xl font-semibold text-stone-800 mt-8 mb-3 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-serif text-lg font-semibold text-stone-700 mt-6 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="font-['Inter'] text-[15px] text-stone-600 leading-relaxed mb-4">
      {children}
    </p>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-stone-800">{children}</strong>
  ),
  em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-stone-600">{children}</em>
  ),
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-4 space-y-1.5 ml-1">{children}</ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-4 space-y-2 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="font-['Inter'] text-[15px] text-stone-600 leading-relaxed flex gap-2">
      <span className="text-stone-300 flex-shrink-0 mt-0.5">–</span>
      <span>{children}</span>
    </li>
  ),
  code: ({ children, className }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="block bg-stone-900 text-stone-100 rounded-xl p-4 overflow-x-auto mb-4 text-sm font-mono leading-relaxed">
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-sm bg-stone-100 text-amber-700 px-1.5 py-0.5 rounded border border-stone-200">
        {children}
      </code>
    )
  },
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="mb-4">{children}</pre>
  ),
  blockquote: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className="border-l-2 border-amber-300 pl-4 my-4 text-stone-500 font-serif italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse font-['Inter'] text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="border-b border-stone-200">{children}</thead>
  ),
  th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="text-left py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="py-2 px-3 text-stone-600 border-b border-stone-100 text-[14px]">
      {children}
    </td>
  ),
  hr: () => <hr className="border-stone-200 my-8" />,
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="text-amber-600 underline underline-offset-2 hover:text-amber-800 transition-colors"
    >
      {children}
    </a>
  ),
}

export default function GuidePage({ params }: GuidePageProps) {
  const guide = getGuide(params.slug)
  if (!guide) notFound()

  const { prev, next } = getAdjacentGuides(params.slug)

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <GuideHeader title={guide.title} showBack={true} />

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Guide metadata header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-3">
            Guide {guide.order} of {getAllGuides().length}
          </p>
          <h1 className="font-serif text-3xl font-bold text-stone-800 leading-snug mb-3">
            {guide.title}
          </h1>
          <p className="font-['Inter'] text-stone-400 text-sm leading-relaxed">
            {guide.description}
          </p>
          <div className="mt-6 w-full h-px bg-stone-200" />
        </div>

        {/* Markdown content */}
        <article>
          <ReactMarkdown components={mdComponents as any}>
            {guide.content}
          </ReactMarkdown>
        </article>

        {/* Prev / next navigation */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/guide/${prev.slug}`}
              className="group flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-0.5"
              />
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
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
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