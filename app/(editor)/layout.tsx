// app/(editor)/layout.tsx
// Auth guard for all editor routes (writing tool).
// Previously lived at app/(app)/layout.tsx.
// No logic changes — folder rename only.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}