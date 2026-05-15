// lib/supabase/admin.ts
// Service-role Supabase client. Import ONLY in server-side API routes.
// NEVER import this in Client Components or expose it to the browser.
// Used for operations that must bypass RLS — specifically the atomic
// ink tip transaction that updates two user balances simultaneously.
//
// Required env variable (server-only, never NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY — found in Supabase dashboard → Settings → API

import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      // Disable auto session management — this client runs on the server only
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)