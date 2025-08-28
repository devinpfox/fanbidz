// app/(app)/wallet/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../../types/supabase';
import AddCoinsButton from '@/components/AddCoinsButton';

export default async function WalletPage() {
  // cookies() is sync in App Router
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle<{ balance: number | null }>();

  const balance = wallet?.balance ?? 0;
  const formatted = new Intl.NumberFormat('en-US').format(balance);

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white">
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-10">
        {/* Top bar */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
          <p className="mt-1 text-sm text-white/60">
            Add coins for purchases and tips.
          </p>
        </header>

        {/* Balance card */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/60">Current balance</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold leading-none tracking-tight">
                  {formatted}
                </span>
                <span className="text-lg text-white/70">coins</span>
              </div>
            </div>
            <span className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500/90 px-3 py-1.5 text-xs font-semibold shadow-lg shadow-emerald-500/20">
              1 coin = $1
            </span>
          </div>

          <div className="mt-5">
            <AddCoinsButton />
          </div>

          <p className="mt-3 text-xs text-white/60">
            Deposits are processed securely. Funds are available right after
            checkout.
          </p>
        </section>

        {/* Recent activity (placeholder) */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 className="mb-2 text-lg font-semibold">Recent activity</h2>
          <ul className="divide-y divide-white/10">
            <li className="flex items-center justify-between py-3">
              <div className="flex flex-col">
                <span className="text-sm">Welcome bonus</span>
                <span className="text-xs text-white/60">—</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">
                +0
              </span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
