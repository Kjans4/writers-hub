// lib/utils/normalizeTag.ts
// Shared tag normalization — used on both client and server.
// "Slow Burn" → "slow-burn"

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30)
}