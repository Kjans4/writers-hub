// lib/ink/bundles.ts
// Hardcoded Ink bundle definitions for the prototype.
// When real payments arrive, these move to a DB table with Stripe price IDs.
// Used by InkShop.tsx and InkBundle.tsx.

export interface InkBundle {
  id: string
  ink: number
  price_usd: number
  label: string | null   // e.g. "Best Value" — null for unlabelled bundles
}

export const INK_BUNDLES: readonly InkBundle[] = [
  { id: 'ink_50',  ink: 50,  price_usd: 0.99,  label: null },
  { id: 'ink_150', ink: 150, price_usd: 2.99,  label: null },
  { id: 'ink_350', ink: 350, price_usd: 5.99,  label: 'Best Value' },
  { id: 'ink_800', ink: 800, price_usd: 12.99, label: null },
] as const

// Platform fee rate — 10% taken on Ink conversion to cash.
// Shown in the author earnings dashboard.
// No actual money moves in the prototype.
export const PLATFORM_FEE_RATE = 0.10

/**
 * Calculate the available (post-fee) amount from total earned Ink.
 * available = total_earned * (1 - PLATFORM_FEE_RATE)
 */
export function calculateAvailable(totalEarned: number): number {
  return Math.floor(totalEarned * (1 - PLATFORM_FEE_RATE))
}