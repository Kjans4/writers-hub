// app/page.tsx
// Navigation fix: redirect root to /home.
// Previously rendered a debug connection status page.

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}