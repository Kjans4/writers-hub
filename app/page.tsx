// app/page.tsx
// Root route — landing page for logged-out users.
// Logged-in users are redirected to /home immediately.
// All static content (FEATURES, STEPS, StoryMapMockup) is unchanged.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  BookOpen,
  GitBranch,
  Map,
  Layers,
  ArrowRight,
  PenLine,
  Globe,
  Sparkles,
} from 'lucide-react'

// ── Static data ──────────────────────────────────────────────

const FEATURES = [
  {
    icon: <GitBranch size={22} className="text-amber-600" />,
    title: 'Version Every Word',
    body:
      'Every paragraph has a history. Save named checkpoints, restore any draft, or fork your entire story into alternate timelines — all without losing a single sentence.',
    accent: 'bg-amber-50 border-amber-100',
  },
  {
    icon: <BookOpen size={22} className="text-violet-500" />,
    title: 'Build Your World',
    body:
      'Characters, locations, lore, objects — your world lives alongside your prose. Type [[ anywhere in a chapter to instantly link an entity and keep your universe consistent.',
    accent: 'bg-violet-50 border-violet-100',
  },
  {
    icon: <Map size={22} className="text-emerald-600" />,
    title: 'See the Story Map',
    body:
      'Watch your narrative take shape as a living graph. Every wikilink you write becomes a visible connection — chapters, characters, and places woven into one map.',
    accent: 'bg-emerald-50 border-emerald-100',
  },
  {
    icon: <Layers size={22} className="text-sky-500" />,
    title: 'Branch & Explore',
    body:
      'Not sure which ending feels right? Fork your Canon into a new branch, write the alternate, and promote it at any time. Your main story is always safe.',
    accent: 'bg-sky-50 border-sky-100',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Create a Project',
    body: 'Start a new story. Every project gets a Canon branch, a chapter list, and a world-building library — ready on day one.',
  },
  {
    number: '02',
    title: 'Write & Link',
    body: 'Write in a distraction-free editor. Use [[ to link characters and places directly into your prose as you go.',
  },
  {
    number: '03',
    title: 'Explore Your World',
    body: 'Open the Story Map to see how everything connects. Hover a wikilink for instant entity facts without leaving the page.',
  },
]

// ── Static SVG Story Map Mockup ───────────────────────────────

function StoryMapMockup() {
  const nodes = [
    { x: 200, y: 130, r: 18, color: '#44403c', label: 'Chapter 1', type: 'chapter' },
    { x: 95,  y: 220, r: 11, color: '#7c3aed', label: 'Elara',     type: 'character' },
    { x: 160, y: 260, r: 11, color: '#059669', label: 'The Vale',  type: 'location' },
    { x: 300, y: 210, r: 11, color: '#7c3aed', label: 'Kael',      type: 'character' },
    { x: 340, y: 280, r: 10, color: '#d97706', label: 'Old Lore',  type: 'lore' },
    { x: 200, y: 310, r: 10, color: '#0284c7', label: 'Rune Blade',type: 'object' },
  ]

  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 5], [3, 4], [1, 2],
  ]

  return (
    <div className="relative rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-stone-100 bg-stone-50">
        <span className="w-3 h-3 rounded-full bg-red-300" />
        <span className="w-3 h-3 rounded-full bg-amber-300" />
        <span className="w-3 h-3 rounded-full bg-green-300" />
        <span className="ml-3 text-xs text-stone-400 font-['Inter']">Story Map — The Glass Meridian</span>
      </div>
      <div className="bg-[#faf9f7] px-4 py-3">
        <svg viewBox="0 0 440 340" className="w-full" style={{ maxHeight: 300 }}>
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a].x} y1={nodes[a].y}
              x2={nodes[b].x} y2={nodes[b].y}
              stroke="#e7e5e4"
              strokeWidth="1.5"
            />
          ))}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle
                cx={n.x} cy={n.y} r={n.r}
                fill={n.color}
                stroke={n.type === 'chapter' ? '#fff' : 'transparent'}
                strokeWidth="2"
                opacity={0.9}
              />
              <text
                x={n.x}
                y={n.y + n.r + 12}
                textAnchor="middle"
                fontSize={n.type === 'chapter' ? 10 : 9}
                fontWeight={n.type === 'chapter' ? '600' : '400'}
                fill={n.type === 'chapter' ? '#1c1917' : '#57534e'}
                fontFamily="Inter, sans-serif"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex items-center gap-4 px-2 pb-1 flex-wrap">
          {[
            { color: '#44403c', label: 'Chapter' },
            { color: '#7c3aed', label: 'Character' },
            { color: '#059669', label: 'Location' },
            { color: '#d97706', label: 'Lore' },
            { color: '#0284c7', label: 'Object' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-stone-500 font-['Inter']">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
// Server component — checks auth, redirects logged-in users to /home.
// Logged-out users see the full landing page below.

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Logged-in users don't need the marketing page
  if (user) redirect('/home')

  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-800">

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#faf9f7]/90 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-500" />
            <span className="font-serif text-lg text-stone-800 tracking-tight">
              Writer's Hub
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-stone-500 hover:text-stone-800 font-['Inter'] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg font-['Inter'] transition-colors"
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-['Inter'] font-medium mb-8">
          <Sparkles size={12} />
          For fiction writers &amp; worldbuilders
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold text-stone-900 leading-tight tracking-tight mb-6">
          Read, Write,
          <br />
          <span className="text-amber-600">Get Inspired.</span>
        </h1>

        <p className="max-w-xl mx-auto text-lg text-stone-500 font-['Inter'] leading-relaxed mb-10">
          Writer's Hub is the writing tool that versions your prose like code,
          maps your world like a wiki, and branches your story like a dream.
          Everything a novelist needs, in one quiet place.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="flex items-center gap-2 px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-xl font-['Inter'] transition-colors shadow-sm"
          >
            <PenLine size={15} />
            Start writing — it's free
          </Link>
          <Link
            href="/home"
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-700 text-sm font-medium rounded-xl font-['Inter'] transition-colors shadow-sm"
          >
            <Globe size={15} />
            Browse stories
          </Link>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-stone-200" /></div>

      {/* ── Feature Highlights ──────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl font-bold text-stone-800 mb-3">
            Everything your story needs
          </h2>
          <p className="text-stone-400 font-['Inter'] text-base max-w-lg mx-auto">
            Built for the writer who wants their tools to get out of the way —
            and step up when it matters.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl border p-6 ${f.accent} transition-shadow hover:shadow-md`}
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-serif text-lg font-semibold text-stone-800 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 font-['Inter'] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-stone-200" /></div>

      {/* ── How It Works ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl font-bold text-stone-800 mb-3">How it works</h2>
          <p className="text-stone-400 font-['Inter'] text-base max-w-lg mx-auto">
            From blank page to living story in three simple steps.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-stone-200 -translate-x-4 z-0" />
              )}
              <div className="relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border border-amber-200 mb-5">
                <span className="text-sm font-bold text-amber-700 font-['Inter']">{step.number}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-800 mb-2">{step.title}</h3>
              <p className="text-sm text-stone-500 font-['Inter'] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-stone-200" /></div>

      {/* ── Story Map Mockup ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-['Inter'] font-medium mb-6">
              <Map size={12} />
              Story Map
            </div>
            <h2 className="font-serif text-3xl font-bold text-stone-800 mb-4 leading-snug">
              See your story from above
            </h2>
            <p className="text-stone-500 font-['Inter'] text-base leading-relaxed mb-6">
              Every wikilink you write in a chapter becomes a visible edge on
              your Story Map. Watch characters and places cluster around the
              chapters that matter — and spot gaps in your world at a glance.
            </p>
            <ul className="space-y-2">
              {[
                'Click any node to navigate directly to that chapter or entity',
                'Color-coded by type: chapters, characters, locations, lore, objects',
                'Updates live as you write — no manual sync required',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-stone-500 font-['Inter']">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div><StoryMapMockup /></div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-stone-200" /></div>

      {/* ── Final CTA Banner ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-4xl font-bold text-stone-800 mb-4">
          Your story is waiting.
        </h2>
        <p className="text-stone-400 font-['Inter'] text-base max-w-md mx-auto mb-8">
          Join Writer's Hub and bring your world to life —
          one chapter, one character, one link at a time.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl font-['Inter'] transition-colors shadow-md"
        >
          <PenLine size={15} />
          Create your free account
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-500" />
            <span className="font-serif text-stone-700 text-sm">Writer's Hub</span>
            <span className="text-stone-300 text-xs font-['Inter'] ml-1">— read, write, get inspired</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/home" className="text-xs text-stone-400 hover:text-stone-700 font-['Inter'] transition-colors">Browse Stories</Link>
            <Link href="/login" className="text-xs text-stone-400 hover:text-stone-700 font-['Inter'] transition-colors">Sign In</Link>
            <Link href="/signup" className="text-xs text-stone-400 hover:text-stone-700 font-['Inter'] transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}