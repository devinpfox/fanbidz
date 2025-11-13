'use client';

import { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';
import WalletDepositModal from './WalletDepositModal';

export default function WalletWidget() {
  const supabase = createClientComponentClient<Database>();
  const [balance, setBalance] = useState<number | null>(null);
  const [isConsumer, setIsConsumer] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [positionY, setPositionY] = useState(() => {
    // Default to upper section of screen (about 20% from top)
    if (typeof window !== 'undefined') {
      return window.innerHeight * 0.2;
    }
    return 150;
  });
  const [dragStartY, setDragStartY] = useState(0);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Check user role and fetch balance
  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Check if user is a consumer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (mounted && profile?.role === 'consumer') {
        setIsConsumer(true);

        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (mounted) setBalance(wallet?.balance ?? 0);

        // Subscribe to balance updates
        channel = supabase
          .channel(`wallet-widget-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const next = (payload.new as any)?.balance;
              if (typeof next === 'number' && mounted) setBalance(next);
            }
          )
          .subscribe();
      }
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Drag handlers for vertical movement
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY - positionY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newY = e.clientY - dragStartY;

      // Keep widget within viewport bounds
      const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 0);

      setPositionY(Math.max(0, Math.min(newY, maxY)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartY]);

  // Don't render if not a consumer or balance not loaded
  if (!isConsumer || balance === null) return null;

  const formattedBalance = new Intl.NumberFormat('en-US').format(balance);

  return (
    <>
      {/* Sliding Tab Container */}
      <div
        ref={widgetRef}
        className="wallet-widget-container fixed left-0 z-50 select-none"
        style={{
          top: `${positionY}px`,
          transform: 'translateY(-50%)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="flex items-center transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${isOpen ? '0' : '-100%'})`,
          }}
        >
          {/* Main Widget Panel */}
          <div className="wallet-widget-panel flex items-center gap-3 rounded-r-full bg-white border border-gray-100 shadow-lg pl-5 pr-2 py-2">
            {/* Left side: Wallet display */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">
                WALLET
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-bold text-black tracking-tight tabular-nums leading-none">
                  {formattedBalance}
                </span>
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.08em] pb-0.5">
                  COINS
                </span>
              </div>
            </div>

            {/* Right side: Add Coins button */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              onMouseDown={(e) => e.stopPropagation()}
              className="wallet-add-coins-btn relative flex items-center gap-2 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white rounded-[22px] pl-3 pr-4 py-2.5 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
            >
              {/* Plus icon circle */}
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/25 border-2 border-white shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>

              {/* Button text */}
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[15px] font-bold leading-none">Add</span>
                <span className="text-[15px] font-bold leading-none">Coins</span>
              </div>
            </button>
          </div>

          {/* Tab Button - positioned absolutely to stick out */}
          <button
            onClick={(e) => {
              // Only toggle if not dragging
              if (!isDragging) {
                setIsOpen(!isOpen);
              }
            }}
            className="wallet-widget-tab absolute left-full top-1/2 -translate-y-1/2 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-r-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 p-3"
            style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
            aria-label={isOpen ? 'Close wallet' : 'Open wallet'}
          >
            {/* Better Coin Icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="opacity-90"
            >
              {/* Outer circle with shine effect */}
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="white"
                opacity="0.95"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                opacity="0.3"
              />
              {/* Inner circle for depth */}
              <circle
                cx="12"
                cy="12"
                r="7"
                stroke="white"
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
              {/* Dollar/Currency symbol */}
              <text
                x="12"
                y="17"
                fontSize="14"
                fontWeight="bold"
                fill="rgba(236, 72, 153, 0.9)"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                $
              </text>
              {/* Shine effect */}
              <ellipse
                cx="9"
                cy="8"
                rx="3"
                ry="2"
                fill="white"
                opacity="0.4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Deposit modal */}
      {showModal && (
        <WalletDepositModal
          balance={balance}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
