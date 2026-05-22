// components/ink/InkShop.tsx
// Shop page layout. Renders the four bundle cards from INK_BUNDLES.
// Shows the user's current balance at the bottom.
// "Buy" buttons are stubs — payment coming post-prototype.

'use client'

import { useEffect, useState } from 'react'
import { INK_BUNDLES } from '@/lib/ink/bundles'
import InkBundle from './InkBundle'

interface InkShopProps {
  isLoggedIn:      boolean
  initialBalance?: number | null
}

export default function InkShop({ isLoggedIn, initialBalance }: InkShopProps) {
  const [balance, setBalance] = useState<number | null>(initialBalance ?? null)

  useEffect(() => {
    if (!isLoggedIn || initialBalance != null) return
    fetch('/api/ink/balance')
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => {})
  }, [isLoggedIn, initialBalance])

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl font-bold text-stone-800 mb-2">
          <span className="text-amber-500">✦</span> Ink Shop
        </h1>
        <p className="text-stone-400 text-sm font-['Inter'] max-w-sm mx-auto leading-relaxed">
          Tip authors whose writing moved you. 10% of every tip keeps Writer's Hub running.
        </p>
      </div>

      {/* Bundle grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {INK_BUNDLES.map((bundle) => (
          <InkBundle
            key={bundle.id}
            bundle={bundle}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>

      {/* Current balance */}
      {isLoggedIn && balance !== null && (
        <div className="text-center">
          <p className="text-sm text-stone-400 font-['Inter']">
            Your balance:{' '}
            <span className="font-semibold text-stone-700">
              <span className="text-amber-500">✦</span> {balance.toLocaleString()}
            </span>
          </p>
        </div>
      )}

      {!isLoggedIn && (
        <div className="text-center">
          <p className="text-sm text-stone-400 font-['Inter']">
            <a href="/login" className="text-amber-600 hover:text-amber-800 underline underline-offset-2">
              Log in
            </a>{' '}
            to purchase Ink or check your balance.
          </p>
        </div>
      )}
    </div>
  )
}