// app/(reading)/layout.tsx
// Minimal layout wrapper for the reading route group.
// Auth is handled at the page level — this layout has no chrome.

export default function ReadingLayout({
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