'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';

// --- Confirmation Dialog Component (Styled) ---
// This is a sub-component that uses the branded aesthetic for the confirmation.
function ConfirmationDialog({
  price,
  onConfirm,
  onCancel,
}: {
  price: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      {/* Dialog Card - Glassmorphism Style */}
      <div className="w-full max-w-sm backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/30 p-6 space-y-6 transform scale-100 animate-in zoom-in-95">
        
        {/* 1. Header (Left Aligned by default) */}
        <h3 className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent text-left">
          Confirm Purchase
        </h3>
        
        {/* 2. Paragraph (Left Aligned by default) */}
        <p className="text-gray-700 text-left">
          Are you sure you want to buy this item now for the price of:
        </p>
        
        {/* 3. Price Display (Already Left Aligned) */}
        <div className="text-3xl font-extrabold text-left bg-gradient-to-r from-fuchsia-700 to-rose-700 bg-clip-text text-transparent p-2 border-y border-pink-200">
          ${price.toFixed(2)}
        </div>
  
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 active:scale-98 transition-transform"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            // Use the branded gradient button style here
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-99 transition-all"
          >
            Confirm Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
// ------------------------------------------

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
  const [showConfirm, setShowConfirm] = useState(false); // New state for modal
  const [msg, setMsg] = useState<string>("");

  const fetchBalance = useCallback(async (): Promise<number> => {
    if (!userId) return 0;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle<{ balance: number }>();
  
    const b = Number(data?.balance ?? 0);
    // Note: Removed setBalance(b) since it's not used in the logic flow, but kept the function signature.
    if (error) console.error("Error fetching balance:", error);
    return b;
  }, [supabase, userId]);
  
  // New handler to initiate the modal
  function initiateBuy() {
    if (!userId) { setMsg('Please log in to buy.'); return; }
    if (!buyNow || buyNow <= 0) { setMsg('This item has no Buy Now price.'); return; }
    
    // Show the styled confirmation modal instead of window.confirm
    setShowConfirm(true); 
  }

  // Actual purchase logic, now called from the modal's confirm button
  async function handleBuyNow() {
    if (!buyNow) return; // Should not happen, but safe check
    
    setShowConfirm(false); // Hide the modal immediately
    setLoading(true);
    setMsg('');
  
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
  
  // Keep the original styling for the main button
  const base =
    variant === 'link'
      ? 'p-0 bg-transparent underline text-gray-700 hover:text-black disabled:text-gray-400'
      : 'px-4 py-1.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50';

  const label = children ?? (buyNow ? `Buy Now — $${buyNow.toFixed(2)}` : 'Buy Now');

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={initiateBuy} // Calls the new function to open the modal
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
      
      {/* Render the confirmation dialog when state is true */}
      {showConfirm && buyNow !== null && (
        <ConfirmationDialog 
          price={buyNow}
          onConfirm={handleBuyNow} 
          onCancel={() => setShowConfirm(false)} 
        />
      )}
    </>
  );
}