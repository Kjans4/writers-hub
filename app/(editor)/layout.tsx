// app/(editor)/layout.tsx
// Layout for the editor shell: project pages, chapter editor, entity pages.
// Dashboard has moved to (reader) — this group now covers only /project/... routes.
// Auth check: unauthenticated users are redirected to /login.
// No ReaderNav here — the editor has its own full-screen chrome.

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