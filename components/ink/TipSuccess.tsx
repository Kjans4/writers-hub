// components/ink/TipSuccess.tsx
// Shown after a successful tip.
// Displays the sent amount, new balance, and a "Tip again" link
// that resets the flow back to TipSelector.

'use client'

import { Check } from 'lucide-react'

interface TipSuccessProps {
  amount:     number
  authorName: string
  newBalance: number
  onTipAgain: () => void
}

export default function TipSuccess({
  amount,
  authorName,
  newBalance,
  onTipAgain,
}: TipSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      {/* Check icon */}
      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
        <Check size={18} className="text-emerald-500" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-stone-800 font-['Inter']">
          <span className="text-amber-500">✦</span> {amount.toLocaleString()} sent to {authorName}
        </p>
        <p className="text-xs text-stone-400 font-['Inter']">
          Your new balance:{' '}
          <span className="font-medium text-stone-600">
            <span className="text-amber-500">✦</span> {newBalance.toLocaleString()}
          </span>
        </p>
      </div>

      <button
        onClick={onTipAgain}
        className="text-xs text-amber-600 hover:text-amber-800 font-['Inter'] underline underline-offset-2 transition-colors mt-1"
      >
        Tip again
      </button>
    </div>
  )
}