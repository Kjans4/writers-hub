// components/ink/TipConfirmation.tsx
// Confirmation step before sending a tip.
// Shows: amount, recipient name, new balance preview.
// "Confirm" fires the tip. "Back" returns to TipSelector.

'use client'

import { Loader2 } from 'lucide-react'

interface TipConfirmationProps {
  amount:      number
  authorName:  string
  balance:     number
  sending:     boolean
  onConfirm:   () => void
  onBack:      () => void
}

export default function TipConfirmation({
  amount,
  authorName,
  balance,
  sending,
  onConfirm,
  onBack,
}: TipConfirmationProps) {
  const newBalance = balance - amount

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 text-center space-y-1">
        <p className="text-sm font-['Inter'] text-stone-600">
          Send{' '}
          <span className="font-bold text-stone-800">
            <span className="text-amber-500">✦</span> {amount.toLocaleString()}
          </span>{' '}
          to{' '}
          <span className="font-bold text-stone-800">{authorName}</span>?
        </p>
        <p className="text-xs text-stone-400 font-['Inter']">
          Your new balance:{' '}
          <span className="font-medium text-stone-600">
            <span className="text-amber-500">✦</span> {newBalance.toLocaleString()}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={sending}
          className="flex-1 py-2.5 border border-stone-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-xl font-['Inter'] transition-colors disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={sending}
          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl font-['Inter'] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending
            ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
            : 'Confirm'
          }
        </button>
      </div>
    </div>
  )
}