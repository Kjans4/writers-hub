// app/(auth)/layout.tsx
// Minimal layout wrapper for all auth routes (login, signup).
// No chrome, no nav — just the page content.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}