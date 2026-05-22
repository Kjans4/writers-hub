// components/ink/InkBalance.tsx
// Ink balance display shown in ReaderNav for logged-in users.
// Renders: ✦ N — links to /shop.
// Env-gated test + button: only visible when
// NEXT_PUBLIC_ENABLE_TEST_INK === 'true'.
// Refetches balance after a successful tip (via onBalanceRefresh prop
// or internal polling — here we expose a refresh trigger via context
// or simply refetch on mount + after tip events).

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

interface InkBalanceProps {
  // Optional initial balance passed from server to avoid loading flash
  initialBalance?: number | null
}

const SHOW_TEST_BUTTON =
  process.env.NEXT_PUBLIC_ENABLE_TEST_INK === 'true'

export default function InkBalance({ initialBalance }: InkBalanceProps) {
  const router = useRouter()
  const [balance, setBalance]   = useState<number | null>(initialBalance ?? null)
  const [adding, setAdding]     = useState(false)

  // ── Fetch balance on mount ────────────────────────────────
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/ink/balance')
      if (!res.ok) return
      const { balance: b } = await res.json()
      setBalance(b ?? 0)
    } catch {
      // Non-fatal
    }
  }, [])

  useEffect(() => {
    // Only fetch if we don't already have an initial value
    if (initialBalance == null) fetchBalance()
  }, [initialBalance, fetchBalance])

  // Listen for tip success events so balance updates immediately
  useEffect(() => {
    function handleTipSuccess(e: Event) {
      const { newBalance } = (e as CustomEvent).detail ?? {}
      if (typeof newBalance === 'number') setBalance(newBalance)
    }
    window.addEventListener('ink:tip-success', handleTipSuccess)
    return () => window.removeEventListener('ink:tip-success', handleTipSuccess)
  }, [])

  // ── Test add ──────────────────────────────────────────────
  async function handleAddTestInk() {
    if (adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/ink/test-add', { method: 'POST' })
      if (!res.ok) return
      const { new_balance } = await res.json()
      setBalance(new_balance)
    } catch {
      // Non-fatal
    } finally {
      setAdding(false)
    }
  }

  if (balance === null) return null

  return (
    <div className="flex items-center gap-1">
      {/* Balance pill — links to shop */}
      <button
        onClick={() => router.push('/shop')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-['Inter'] text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors"
        title="Your Ink balance — click to visit the shop"
      >
        <span className="text-amber-500 font-bold">✦</span>
        <span className="font-medium tabular-nums">{balance.toLocaleString()}</span>
      </button>

      {/* Test + button — only in dev/staging */}
      {SHOW_TEST_BUTTON && (
        <button
          onClick={handleAddTestInk}
          disabled={adding}
          title="Add 500 test Ink"
          className="p-1 text-stone-300 hover:text-amber-500 transition-colors rounded disabled:opacity-40"
        >
          {adding
            ? <Loader2 size={12} className="animate-spin" />
            : <Plus size={12} />
          }
        </button>
      )}
    </div>
  )
}