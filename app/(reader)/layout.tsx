// app/(reader)/layout.tsx
// Layout for all reader-facing routes: home feed, story pages,
// author profiles, and the publish wizard.
// Provides the global nav bar (Home, Write, Avatar).
// Auth is checked client-side — these pages are publicly accessible
// but some actions (follow, progress) require login.

import { createClient } from '@/lib/supabase/server'
import ReaderNav from '@/components/layout/ReaderNav'

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile for avatar if logged in
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      <ReaderNav user={user} profile={profile} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}