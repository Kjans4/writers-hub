// components/publish/EarningsDashboard.tsx
// Earnings tab content inside ManagePublishing.
// Shows: total earned, available (after 10% fee), tips by chapter
// with bar visual, recent tips (anonymous — no identity shown).
//
// Props:
//   projectId — used to fetch earnings from GET /api/ink/earnings/[projectId]

'use client'

import { useEffect, useState } from 'react'
import { Loader2, TrendingUp } from 'lucide-react'

interface ChapterEarning {
  document_id:    string
  chapter_number: number
  chapter_title:  string
  total_tips:     number
}

interface RecentTip {
  amount:        number
  chapter_title: string
  created_at:    string
}

interface EarningsData {
  total_earned: number
  available:    number
  by_chapter:   ChapterEarning[]
  recent_tips:  RecentTip[]
}

interface EarningsDashboardProps {
  projectId: string
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function EarningsDashboard({ projectId }: EarningsDashboardProps) {
  const [data, setData]       = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [showConvertTip, setShowConvertTip] = useState(false)

  const PAGE_SIZE = 10

  useEffect(() => {
    fetch(`/api/ink/earnings/${projectId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={18} className="text-stone-300 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-stone-400 font-['Inter']">
          Could not load earnings. Please try refreshing.
        </p>
      </div>
    )
  }

  const maxTips = Math.max(...data.by_chapter.map((c) => c.total_tips), 1)
  const visibleTips = data.recent_tips.slice(0, page * PAGE_SIZE)
  const hasMore = visibleTips.length < data.recent_tips.length

  return (
    <div className="space-y-10">

      {/* Totals */}
      <section>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-1">
              Total Earned
            </p>
            <p className="font-serif text-2xl font-bold text-stone-800">
              <span className="text-amber-500">✦</span>{' '}
              {data.total_earned.toLocaleString()}
            </p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Inter'] mb-1">
              Available
            </p>
            <p className="font-serif text-2xl font-bold text-stone-800">
              <span className="text-amber-500">✦</span>{' '}
              {data.available.toLocaleString()}
            </p>
            <p className="text-xs text-stone-400 font-['Inter'] mt-0.5">
              after 10% platform fee
            </p>
          </div>
        </div>

        {/* Convert to cash — stub */}
        <div className="mt-3 relative inline-block">
          <button
            onMouseEnter={() => setShowConvertTip(true)}
            onMouseLeave={() => setShowConvertTip(false)}
            className="text-xs text-stone-300 font-['Inter'] cursor-not-allowed flex items-center gap-1.5 px-3 py-1.5 border border-stone-100 rounded-lg"
            disabled
          >
            <TrendingUp size={12} />
            Convert to cash — Coming soon
          </button>
          {showConvertTip && (
            <div className="absolute top-full left-0 mt-1.5 w-52 bg-stone-800 text-white text-xs font-['Inter'] px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10">
              Cash payouts are coming in a future update. Your Ink is tracked and waiting.
            </div>
          )}
        </div>
      </section>

      {/* Tips by chapter */}
      {data.by_chapter.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-4">
            Tips by Chapter
          </h3>
          <div className="space-y-3">
            {data.by_chapter.map((ch) => {
              const pct = (ch.total_tips / maxTips) * 100
              return (
                <div key={ch.document_id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-stone-700 font-['Inter'] truncate">
                        {ch.chapter_title}
                      </p>
                      <span className="text-sm font-semibold text-stone-800 font-['Inter'] flex-shrink-0 ml-3">
                        <span className="text-amber-500">✦</span>{' '}
                        {ch.total_tips.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent tips */}
      {data.recent_tips.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-['Inter'] mb-4">
            Recent Tips
          </h3>
          <div className="space-y-2">
            {visibleTips.map((tip, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl"
              >
                <span className="text-sm font-semibold text-stone-800 font-['Inter'] flex-shrink-0">
                  <span className="text-amber-500">✦</span>{' '}
                  {tip.amount.toLocaleString()}
                </span>
                <span className="text-sm text-stone-500 font-['Inter'] flex-1 truncate">
                  {tip.chapter_title}
                </span>
                <span className="text-xs text-stone-300 font-['Inter'] flex-shrink-0">
                  A reader
                </span>
                <span className="text-xs text-stone-300 font-['Inter'] flex-shrink-0">
                  {formatRelativeTime(tip.created_at)}
                </span>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="mt-3 w-full py-2 text-xs text-stone-400 hover:text-stone-600 font-['Inter'] transition-colors"
            >
              Load more
            </button>
          )}
        </section>
      )}

      {data.total_earned === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-stone-400 font-['Inter']">
            No tips yet. Tips from readers will appear here.
          </p>
        </div>
      )}
    </div>
  )
}