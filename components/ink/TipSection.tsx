// components/ink/TipSection.tsx
// Tip section shown at the end of every chapter, below chapter navigation.
// Orchestrates the full tip flow: Selector → Confirmation → Success.
//
// Flow states:
//   'idle'         — showing author name + amount selector
//   'confirming'   — showing TipConfirmation card
//   'sending'      — TipConfirmation with spinner
//   'success'      — TipSuccess state
//
// Multiple tips per chapter are supported — "Tip again" resets to 'idle'.
// Logged-out users see a "Log in to tip" prompt.
//
// Props:
//   storyId      — published_stories.id (needed for the tip API)
//   documentId   — chapter document UUID (stored in transaction)
//   authorName   — display name of the story author
//   isLoggedIn   — controls logged-out state

'use client'

import { useEffect, useState } from 'react'
import TipSelector from './TipSelector'
import TipConfirmation from './TipConfirmation'
import TipSuccess from './TipSuccess'

type FlowState = 'idle' | 'confirming' | 'sending' | 'success'

interface TipSectionProps {
  storyId:    string
  documentId: string
  authorName: string
  isLoggedIn: boolean
}

export default function TipSection({
  storyId,
  documentId,
  authorName,
  isLoggedIn,
}: TipSectionProps) {
  const [balance, setBalance]       = useState<number | null>(null)
  const [selected, setSelected]     = useState<number | null>(null)
  const [flow, setFlow]             = useState<FlowState>('idle')
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [error, setError]           = useState<string | null>(null)

  // ── Fetch balance on mount ────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/ink/balance')
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => setBalance(0))
  }, [isLoggedIn])

  // ── Send tip ──────────────────────────────────────────────
  async function handleConfirm() {
    if (!selected || balance === null) return
    setFlow('sending')
    setError(null)

    try {
      const res = await fetch('/api/ink/tip', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount:      selected,
          document_id: documentId,
          story_id:    storyId,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
        setFlow('confirming')
        return
      }

      const nb = json.new_balance
      setNewBalance(nb)
      setBalance(nb)
      setFlow('success')

      // Fire global event so InkBalance in nav updates immediately
      window.dispatchEvent(
        new CustomEvent('ink:tip-success', { detail: { newBalance: nb } })
      )
    } catch {
      setError('Network error. Please try again.')
      setFlow('confirming')
    }
  }

  function handleTipAgain() {
    setSelected(null)
    setFlow('idle')
    setError(null)
  }

  // ── Logged-out state ──────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="max-w-[680px] mx-auto mt-12 mb-4 px-6 py-5 bg-stone-50 border border-stone-200 rounded-2xl text-center">
        <p className="text-sm text-stone-500 font-['Inter']">
          Enjoyed this chapter? Support {authorName} with Ink.
        </p>
        <a
          href="/login"
          className="mt-2 inline-block text-xs text-amber-600 hover:text-amber-800 font-['Inter'] underline underline-offset-2 transition-colors"
        >
          Log in to tip
        </a>
      </div>
    )
  }

  if (balance === null) return null

  return (
    <div className="max-w-[680px] mx-auto mt-12 mb-4 bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100">
        <p className="text-sm font-semibold text-stone-700 font-['Inter']">
          Enjoyed this chapter?{' '}
          <span className="font-normal text-stone-500">
            Support {authorName} with Ink.
          </span>
        </p>
        <p className="text-xs text-stone-400 font-['Inter'] mt-0.5">
          Your balance:{' '}
          <span className="font-medium text-stone-600">
            <span className="text-amber-500">✦</span> {balance.toLocaleString()}
          </span>
        </p>
      </div>

      {/* Flow body */}
      <div className="px-6 py-5">

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 font-['Inter'] mb-3">{error}</p>
        )}

        {(flow === 'idle') && (
          <>
            <TipSelector
              balance={balance}
              selected={selected}
              onChange={setSelected}
            />
            {selected !== null && selected <= balance && (
              <button
                onClick={() => setFlow('confirming')}
                className="mt-4 w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-xl font-['Inter'] transition-colors"
              >
                Send <span className="text-amber-400">✦</span> {selected.toLocaleString()} to {authorName}
              </button>
            )}
            {balance === 0 && (
              <p className="mt-3 text-xs text-stone-400 font-['Inter'] text-center">
                No Ink left.{' '}
                <a href="/shop" className="text-amber-600 hover:text-amber-800 underline underline-offset-2">
                  Get more →
                </a>
              </p>
            )}
          </>
        )}

        {(flow === 'confirming' || flow === 'sending') && selected !== null && (
          <TipConfirmation
            amount={selected}
            authorName={authorName}
            balance={balance}
            sending={flow === 'sending'}
            onConfirm={handleConfirm}
            onBack={() => setFlow('idle')}
          />
        )}

        {flow === 'success' && selected !== null && newBalance !== null && (
          <TipSuccess
            amount={selected}
            authorName={authorName}
            newBalance={newBalance}
            onTipAgain={handleTipAgain}
          />
        )}
      </div>
    </div>
  )
}