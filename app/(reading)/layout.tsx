// app/(reading)/layout.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ReadingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {children}
    </div>
  )
}