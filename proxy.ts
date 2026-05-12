// proxy.ts  (was middleware.ts — renamed for Next.js 16)
// Place at the ROOT of your project (same level as package.json).
// Delete middleware.ts after adding this file.
//
// Guards all routes: redirects unauthenticated users to /login,
// redirects authenticated users away from auth pages.
//
// PUBLIC_PREFIXES — routes that unauthenticated readers can access.
// Required for Chunk 1: story pages, author pages, and the home feed
// must be reachable without login so readers can browse freely.
// Chunk 2 additions (/genre/, /tag/, /search) are pre-listed here.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without authentication
const PUBLIC_PREFIXES = [
  '/login',
  '/signup',

  // ── Reader routes (Chunk 1) ───────────────────────────────
  '/home',        // home feed
  '/story/',      // story info + chapter reading pages
  '/author/',     // author profile pages

  // ── Discovery routes (Chunk 2 — pre-listed) ──────────────
  '/genre/',      // genre browse pages
  '/tag/',        // tag browse pages
  '/search',      // search results page
]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/signup')

  // Not logged in and trying to access a protected route → send to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in and hitting auth pages → send to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}