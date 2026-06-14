// app/(reading)/layout.tsx
// Minimal layout for the chapter reading experience.
// Intentionally has NO ReaderNav — ReadingHeader replaces it for these routes.
// This is a separate route group from (reader) so the global nav is suppressed.
// Routes under this group:
//   /story/[slug]/chapter/[number]  (moved from (reader))

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