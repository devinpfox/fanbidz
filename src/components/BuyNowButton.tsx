'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';

type Props = {
  listingId: string;
  buyNow: number | null;
  userId: string | null;
  ended?: boolean;
  initialBalance?: number;

  // styling / label
  variant?: 'button' | 'link';
  className?: string;
  children?: React.ReactNode;
};

export default function BuyNowButton({
  listingId,
  buyNow,
  userId,
  ended = false,
  initialBalance = 0,
  variant = 'button',
  className,
  children,
}: Props) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [msg, setMsg] = useState<string>("");

  async function fetchBalance(): Promise<number> {
    if (!userId) return 0;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle<{ balance: number }>(); // avoids throw if row doesn't exist
  
    const b = Number(data?.balance ?? 0);
    if (!error) setBalance(b); // keep UI in sync
    return b;
  }
  
  async function handleBuyNow() {
    if (!userId) { setMsg('Please log in to buy.'); return; }
    if (!buyNow || buyNow <= 0) { setMsg('This item has no Buy Now price.'); return; }
    if (!window.confirm(`Buy now for $${buyNow.toFixed(2)}?`)) return;
  
    setLoading(true);
    setMsg('');
  
    // Use the *fresh* value, not the state
    const currentBalance = await fetchBalance();
  
    if (currentBalance < buyNow) {
      setMsg('❌ Not enough coins. Redirecting to wallet…');
      setTimeout(() => (window.location.href = '/wallet'), 800);
      setLoading(false);
      return;
    }
  
    try {
      const res = await fetch('/api/buy-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const data = await res.json();
  
      if (!res.ok) {
        const e = String(data?.error || 'Failed to buy').toLowerCase();
        if (e.includes('insufficient')) {
          setMsg('❌ Insufficient coins. Redirecting to wallet…');
          setTimeout(() => (window.location.href = '/wallet'), 800);
        } else if (res.status === 409 || e.includes('already sold')) {
          setMsg('This item was just sold. Redirecting…');
          setTimeout(() => router.replace('/'), 600);
        } else {
          setMsg(`❌ ${data?.error || 'Failed to buy'}`);
        }
        return;
      }
  
      const orderId: string | undefined = data?.order_id;
      if (orderId) {
        router.prefetch(`/purchase/${orderId}/shipping`);
        router.replace(`/purchase/${orderId}/shipping`);
      } else {
        router.replace('/purchases');
      }
    } catch {
      setMsg('Network error, try again.');
    } finally {
      setLoading(false);
    }
  }
  

  const base =
    variant === 'link'
      ? 'p-0 bg-transparent underline text-gray-700 hover:text-black disabled:text-gray-400'
      : 'px-4 py-1.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50';

  const label = children ?? (buyNow ? `Buy Now — $${buyNow.toFixed(2)}` : 'Buy Now');

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={ended || loading || !buyNow}
        className={`${base} ${className ?? ''}`}
        aria-disabled={ended || loading || !buyNow}
        aria-label="Buy Now"
      >
        {loading ? 'Processing…' : label}
      </button>

      {/* Keep the helper text for the solid button; hide for link if you prefer */}
      {variant !== 'link' && msg && <p className="text-xs text-gray-600">{msg}</p>}
    </div>
  );
}
