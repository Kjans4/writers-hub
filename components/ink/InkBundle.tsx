// components/ink/InkBundle.tsx
// A single Ink bundle card on the /shop page.
// "Buy" button shows a "Coming soon" tooltip — no payment form in prototype.
// Highlights the "Best Value" bundle with a badge.

'use client'

import { useState } from 'react'
import { InkBundle as InkBundleType } from '@/lib/ink/bundles'

interface InkBundleProps {
  bundle:     InkBundleType
  isLoggedIn: boolean
}

export default function InkBundle({ bundle, isLoggedIn }: InkBundleProps) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div
      className={`
        relative flex flex-col items-center gap-3 px-6 py-6
        bg-white border rounded-2xl transition-shadow
        ${bundle.label
          ? 'border-amber-300 shadow-md shadow-amber-100'
          : 'border-stone-200 hover:border-stone-300 hover:shadow-sm'}
      `}
    >
      {/* Best Value badge */}
      {bundle.label && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-semibold font-['Inter'] px-3 py-0.5 rounded-full whitespace-nowrap">
          {bundle.label}
        </span>
      )}

      {/* Ink amount */}
      <div className="text-center">
        <p className="font-serif text-3xl font-bold text-stone-800">
          <span className="text-amber-500">✦</span>{' '}
          {bundle.ink.toLocaleString()}
        </p>
        <p className="text-xs text-stone-400 font-['Inter'] mt-0.5">Ink</p>
      </div>

      {/* Price */}
      <p className="text-lg font-semibold text-stone-700 font-['Inter']">
        ${bundle.price_usd.toFixed(2)}
      </p>

      {/* Buy button */}
      <div className="relative w-full">
        <button
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onClick={() => {
            if (!isLoggedIn) {
              window.location.href = '/login'
              return
            }
            setShowTip(true)
            setTimeout(() => setShowTip(false), 2000)
          }}
          className={`
            w-full py-2.5 rounded-xl text-sm font-medium font-['Inter'] transition-colors
            ${bundle.label
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}
          `}
        >
          Buy — Coming soon
        </button>

        {/* Tooltip */}
        {showTip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-stone-800 text-white text-xs font-['Inter'] px-3 py-2 rounded-lg shadow-lg text-center pointer-events-none z-10">
            Payment coming soon — use the{' '}
            <span className="text-amber-300 font-semibold">+</span>{' '}
            button next to your balance to add test Ink for now.
          </div>
        )}
      </div>
    </div>
  )
}