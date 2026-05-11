// app/(editor)/layout.tsx
// Layout for the editor shell: project pages, chapter editor, entity pages.
// Auth check only — the editor has its own full-screen chrome (top bar,
// left panel, right panel). The global reader nav does NOT appear here.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}