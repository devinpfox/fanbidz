import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../../../types/supabase';
import AddCoinsButton from '@/components/AddCoinsButton';
import Image from 'next/image';

// This is a Next.js Server Component, which is why it's async.
export default async function WalletPage() {
  // ✅ FIX: The most reliable pattern is to pass the cookies function 
  // wrapped in an anonymous function, allowing the auth-helper to call 
  // the dynamic 'cookies' function at the correct time.
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookies(), 
  });
  
  // 1. Authentication Check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login page
  if (!user) {
    redirect('/login');
  }

  // 2. Data Fetching
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    // Use maybeSingle to handle cases where a wallet might not exist for the user
    .maybeSingle<{ balance: number | null }>();

  // Calculate and format balance
  const balance = wallet?.balance ?? 0;
  const formatted = new Intl.NumberFormat('en-US').format(balance);

  // 3. Render Component
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-10">
        
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <Image
            src="/fanbids-logo.svg"
            alt="Fanbids Logo"
            width={120}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
            <p className="mt-1 text-sm text-black/60">
              Add coins for purchases and tips.
            </p>
          </div>
        </header>

        {/* Current Balance Section */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-black/60">Current balance</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold leading-none tracking-tight">
                  {formatted}
                </span>
                <span className="text-lg text-black/70">coins</span>
              </div>
            </div>
            <span className="rounded-xl bg-gradient-to-br text-white from-[rgb(255,78,207)] to-purple-500 px-3 py-1.5 text-xs font-semibold shadow-lg shadow-[rgba(255,78,207,0.25)]">
              1 coin = $1
            </span>
          </div>

          <div className="mt-5">
            <AddCoinsButton />
          </div>

          <p className="mt-3 text-xs text-black/60">
            Deposits are processed securely. Funds are available right after
            checkout.
          </p>
        </section>

        {/* Recent Activity Section */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 className="mb-2 text-lg font-semibold">Recent activity</h2>
          <ul className="divide-y divide-white/10">
            <li className="flex items-center justify-between py-3">
              <div className="flex flex-col">
                <span className="text-sm">Welcome bonus</span>
                <span className="text-xs text-black/60">—</span>
              </div>
              <span className="text-sm font-medium text-[rgb(255,78,207)]">
                +0
              </span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}