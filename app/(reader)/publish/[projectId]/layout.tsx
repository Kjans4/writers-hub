// app/(reader)/publish/[projectId]/layout.tsx
// Minimal full-screen layout for the publish wizard.
// Deliberately has no sidebar, no editor chrome, no nav bar.
// Just a clean centered surface for the multi-step form.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PublishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {children}
    </div>
  )
}