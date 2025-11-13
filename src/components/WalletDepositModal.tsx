'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';

interface WalletDepositModalProps {
  balance: number;
  onClose: () => void;
}

export default function WalletDepositModal({
  balance,
  onClose,
}: WalletDepositModalProps) {
  const [coins, setCoins] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const presets = useMemo(() => [10, 25, 50, 100], []);

  const formatted = new Intl.NumberFormat('en-US').format(balance);

  const startCheckout = async () => {
    if (!coins || coins < 1) return;
    setLoading(true);
    try {
      // Get current URL to return to after checkout
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';

      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: coins,
          returnUrl: returnUrl
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="wallet-deposit-modal fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="wallet-modal-close absolute top-4 right-4 text-black/60 hover:text-black transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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
        <section className="rounded-3xl border border-black/10 bg-white/5 p-5 backdrop-blur-md shadow-xl">
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
            {/* Quick amount chips */}
            <div className="wallet-deposit-presets mb-3 grid grid-cols-4 gap-2">
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
                        ? 'bg-white text-black border-black'
                        : 'bg-white/5 text-black hover:bg-white/10 border-black/15',
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
                className="flex-1 rounded-2xl border border-black/15 bg-black/5 px-4 py-3 text-base text-black placeholder-black/40 outline-none focus:border-black/30"
                placeholder="Amount (coins)"
                aria-label="Amount in coins"
              />
              <button
                type="button"
                onClick={startCheckout}
                disabled={loading || coins < 1}
                className="inline-flex items-center text-white justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 px-4 py-3 text-sm font-semibold shadow-lg shadow-rose-500/25 disabled:opacity-50"
              >
                {loading ? 'Redirecting…' : 'Add Coins'}
              </button>
            </div>

            <p className="mt-2 text-xs text-black/60">Minimum deposit is 1 coin.</p>
          </div>

          <p className="mt-3 text-xs text-black/60">
            Deposits are processed securely. Funds are available right after checkout.
          </p>
        </section>
      </div>
    </div>
  );
}
