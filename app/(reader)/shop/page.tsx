// app/(reader)/shop/page.tsx
// Ink shop page — publicly accessible (in middleware whitelist).
// "Buy" buttons require login but the page itself is public.

import { createClient } from '@/lib/supabase/server'
import InkShop from '@/components/ink/InkShop'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch balance server-side to avoid loading flash
  let initialBalance: number | null = null
  if (user) {
    const { data } = await supabase
      .from('ink_balances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()
    initialBalance = data?.balance ?? 0
  }

  return (
    <InkShop
      isLoggedIn={!!user}
      initialBalance={initialBalance}
    />
  )
}