// components/ink/TipSelector.tsx
// Amount selector for the tip flow.
// Four presets (10, 50, 100, custom) + custom numeric input.
// Buttons are disabled when the user's balance is insufficient.
// Calls onChange with the selected/typed amount.

'use client'

import { useState } from 'react'

interface TipSelectorProps {
  balance:   number
  selected:  number | null
  onChange:  (amount: number | null) => void
}

const PRESETS = [
  { amount: 10,  emoji: '☕', label: 'Enjoyed'    },
  { amount: 50,  emoji: '✨', label: 'Beautiful'  },
  { amount: 100, emoji: '🔥', label: 'Incredible' },
]

export default function TipSelector({
  balance,
  selected,
  onChange,
}: TipSelectorProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState('')

  function selectPreset(amount: number) {
    setCustomMode(false)
    setCustomValue('')
    onChange(selected === amount ? null : amount)
  }

  function activateCustom() {
    setCustomMode(true)
    onChange(null)
    setCustomValue('')
  }

  function handleCustomChange(raw: string) {
    setCustomValue(raw)
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1) {
      onChange(n)
    } else {
      onChange(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map(({ amount, emoji, label }) => {
          const insufficient = amount > balance
          const isSelected   = !customMode && selected === amount

          return (
            <button
              key={amount}
              onClick={() => selectPreset(amount)}
              disabled={insufficient}
              title={insufficient ? 'Insufficient Ink balance' : label}
              className={`
                flex flex-col items-center gap-1 px-2 py-3 rounded-xl border
                text-xs font-['Inter'] transition-all
                ${isSelected
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : insufficient
                  ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50'}
              `}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="font-semibold">
                <span className="text-amber-500">✦</span> {amount}
              </span>
              <span className="text-stone-400 text-[10px]">{label}</span>
            </button>
          )
        })}

        {/* Custom button */}
        <button
          onClick={activateCustom}
          className={`
            flex flex-col items-center gap-1 px-2 py-3 rounded-xl border
            text-xs font-['Inter'] transition-all
            ${customMode
              ? 'border-amber-400 bg-amber-50 text-amber-800'
              : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50'}
          `}
        >
          <span className="text-base leading-none">💎</span>
          <span className="font-semibold text-stone-500">Custom</span>
          <span className="text-stone-400 text-[10px]">Any amount</span>
        </button>
      </div>

      {/* Custom input */}
      {customMode && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-amber-300 rounded-xl focus-within:ring-2 focus-within:ring-amber-400/40 transition-all">
          <span className="text-amber-500 font-bold text-sm flex-shrink-0">✦</span>
          <input
            autoFocus
            type="number"
            min={1}
            max={balance}
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={`1 – ${balance.toLocaleString()}`}
            className="flex-1 text-sm font-['Inter'] text-stone-700 bg-transparent outline-none placeholder:text-stone-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      )}

      {/* Insufficient custom amount warning */}
      {customMode && selected !== null && selected > balance && (
        <p className="text-xs text-red-500 font-['Inter'] flex items-center gap-1.5">
          Not enough Ink.{' '}
          <a href="/shop" className="underline underline-offset-2 hover:text-red-700">
            Get more →
          </a>
        </p>
      )}
    </div>
  )
}