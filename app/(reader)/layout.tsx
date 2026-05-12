// app/(reader)/layout.tsx
// Layout for all reader-facing routes:
//   /home, /story/[slug], /story/[slug]/chapter/[number], /author/[username]
// Provides the top nav bar (ReaderNav) with Home / Write / Search / Avatar.
// Auth check: unauthenticated users are redirected to /login.
// This layout intentionally has NO three-panel writing shell.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReaderNav from '@/components/reader/ReaderNav'

export default async function ReaderLayout({
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

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <ReaderNav />
      <main>{children}</main>
    </div>
  )
}