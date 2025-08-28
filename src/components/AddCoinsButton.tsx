// components/AddCoinsButton.tsx
'use client';

import { useMemo, useState } from 'react';

export default function AddCoinsButton({ initial = 10 }: { initial?: number }) {
  const [coins, setCoins] = useState<number>(initial);
  const [loading, setLoading] = useState(false);
  const presets = useMemo(() => [10, 25, 50, 100], []);

  const startCheckout = async () => {
    if (!coins || coins < 1) return;
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: coins }),
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert(data?.error || 'Failed to start checkout');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Quick amount chips */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {presets.map((p) => {
          const active = coins === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setCoins(p)}
              className={[
                'rounded-2xl px-3 py-2 text-sm font-medium transition active:scale-95 border',
                active
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-white hover:bg-white/10 border-white/15',
              ].join(' ')}
              aria-pressed={active}
            >
              +{p}
            </button>
          );
        })}
      </div>

      {/* Custom amount + CTA */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={Number.isFinite(coins) ? coins : 0}
          onChange={(e) =>
            setCoins(Math.max(0, parseInt(e.target.value || '0', 10)))
          }
          inputMode="numeric"
          className="flex-1 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white placeholder-white/40 outline-none focus:border-white/30"
          placeholder="Amount (coins)"
          aria-label="Amount in coins"
        />
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading || coins < 1}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : 'Add Coins'}
        </button>
      </div>

      <p className="mt-2 text-xs text-white/60">
        Minimum deposit is 1 coin.
      </p>
    </div>
  );
}
