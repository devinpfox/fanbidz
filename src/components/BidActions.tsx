'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';

type Props = {
  listingId: string;
  userId: string | null;
  initialLastBid: number;      // Number(listing.last_bid ?? 0)
  buyNow: number | null;       // listing.buy_now != null ? Number(...) : null
  ended: boolean;              // listing.seconds_left != null && listing.seconds_left <= 0
  initialBalance: number;      // Number(wallet.balance ?? 0) from server
};

export default function BidActions({
  listingId,
  userId,
  initialLastBid,
  buyNow,
  ended,
  initialBalance,
}: Props) {
  const supabase = createClientComponentClient<Database>();
  const [lastBid, setLastBid] = useState<number>(initialLastBid);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function refreshBalance() {
    // If RLS allows, fetch latest balance; otherwise we fall back to server error handling.
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .single() as any;
    if (!error) setBalance(Number(data?.balance ?? 0));
  }

  async function handleBid() {
    if (!userId) {
      setMsg("Please log in to place a bid.");
      return;
    }

    const input = window.prompt("Enter your bid amount", String((lastBid || 0) + 1));
    if (!input) return;

    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMsg("Enter a valid amount.");
      return;
    }

    setLoading(true);
    setMsg("");

    // Pre-check coins (best-effort; final check still happens on server)
    await refreshBalance();
    if (amount > balance) {
      setMsg("❌ Not enough coins. Add more in your wallet.");
      // quick CTA
      setTimeout(() => { window.location.href = "/wallet"; }, 800);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        // If server says insufficient, guide user to wallet
        if (String(data.error || "").toLowerCase().includes("insufficient")) {
          setMsg("❌ Insufficient coins. Redirecting to wallet…");
          setTimeout(() => { window.location.href = "/wallet"; }, 800);
        } else {
          setMsg(`❌ ${data.error || "Failed to place bid"}`);
        }
      } else {
        setLastBid(amount);
        // Optimistically lower local balance (server already deducted)
        setBalance((b) => Math.max(0, b - amount));
        setMsg("✅ Bid placed!");
      }
    } catch {
      setMsg("Network error, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-between items-center px-4 py-4 mt-2 border-t">
      <div className="space-y-1 text-sm">
        <p className="text-gray-700">
          Last Bid: <span className="font-semibold">${(lastBid ?? 0).toFixed(2)}</span>
        </p>
        <p className="text-gray-500">
          Buy Now:{" "}
          <span className="font-semibold">
            {buyNow != null ? `$${buyNow.toFixed(2)}` : "$0.00"}
          </span>
        </p>
        {msg && <p className="text-xs text-gray-500">{msg}</p>}
      </div>

      <button
        onClick={handleBid}
        disabled={ended || loading}
        className="px-4 py-1.5 bg-[rgb(255,78,207)] text-white rounded-full text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {ended ? "Ended" : loading ? "Bidding..." : "Bid →"}
      </button>
    </div>
  );
}
