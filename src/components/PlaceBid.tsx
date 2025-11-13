'use client';

import { useState, useTransition } from "react";
import AddCoinsButton from "@/components/AddCoinsButton"; 
import React from "react"; // Required for React.Dispatch type

interface Props {
  listingId: string;
  userId: string | null;
  // ⭐ ADDED: Prop for setting the live highest bid back in the parent component (PostRightCTA)
  setLiveHighestBid: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function PlaceBid({ listingId, userId, setLiveHighestBid }: Props) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [lastTriedAmount, setLastTriedAmount] = useState<number>(10);

  const placeBid = async () => {
    if (!userId) {
      // Updated message to match the design's error format
      setMessage("❌ Please log in to place a bid.");
      return;
    }

    const bidValue = parseFloat(amount);
    if (isNaN(bidValue) || bidValue <= 0) {
      setMessage("❌ Enter a valid bid amount.");
      return;
    }

    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, amount: bidValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ ${data.error}`);

        if (data.error === "Insufficient coins") {
          setLastTriedAmount(bidValue);
          setShowTopUp(true);
        }
      } else {
        // Success
        setAmount("");
        setMessage("✅ Bid placed successfully!");
        setShowTopUp(false);
        
        // ⭐ LOGIC INTEGRATED: Optimistically update the highest bid in the parent state
        setLiveHighestBid(prev => prev !== null ? Math.max(prev, bidValue) : bidValue);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to place bid. Try again.");
    }
  };

  const isSuccess = message.startsWith("✅");
  const isError = message.startsWith("❌");

  return (
    <div className="mt-2 space-y-4">

      {/* BID CARD - Glass Card Design */}
      <div
        className="
          backdrop-blur-xl bg-white/80
          border border-white/20
          shadow-xl shadow-black/5
          rounded-2xl
          p-6
          transition-all duration-300
        "
      >
        <label className="text-sm font-semibold text-gray-500 uppercase tracking-[0.08em]">
          Enter Your Bid
        </label>

        {/* Input + Button */}
        <div className="mt-3 flex gap-3">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="
              w-full px-4 py-3 rounded-xl
              bg-white/80 border border-gray-100/50
              focus:ring-2 focus:ring-pink-400 focus:border-transparent
              text-gray-900 font-bold text-lg
              placeholder:text-gray-300
              transition-all
            "
          />

          <button
            onClick={() => startTransition(placeBid)}
            disabled={isPending}
            className="
              px-6 py-3 rounded-xl
              bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500
              text-white font-semibold text-base
              shadow-lg shadow-pink-500/30
              hover:shadow-xl hover:scale-[1.03]
              active:scale-95
              disabled:opacity-50 disabled:scale-100
              transition-all duration-200
              whitespace-nowrap
            "
          >
            {isPending ? "Bidding…" : "Place Bid"}
          </button>
        </div>

        {/* Message Container - Luxurious Alert Styling */}
        {message && (
          <div
            className={`
              mt-4 rounded-xl p-4 animate-in fade-in duration-300
              flex items-start gap-4 border text-sm font-medium
              ${
                isSuccess
                  ? "bg-green-50/70 border-green-200 text-green-900"
                  : isError
                  ? "bg-rose-50/70 border-rose-200 text-rose-900"
                  : ""
              }
            `}
          >
            {/* Icon */}
            <div className="
              w-5 h-5 mt-0.5 flex-shrink-0
            ">
              {isSuccess ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Text */}
            <p className="tracking-tight leading-snug">
              {message.substring(2)} {/* Remove the prefix (✅ or ❌) */}
            </p>
          </div>
        )}
      </div>

      {/* TOP-UP SECTION - Premium Gradient Style */}
      {showTopUp && (
        <div
          className="
            rounded-2xl 
            bg-gradient-to-br from-fuchsia-50 to-pink-50 
            border border-fuchsia-200 
            shadow-xl shadow-pink-300/30
            p-6 
            animate-in fade-in slide-in-from-bottom-2 duration-300
            text-center
          "
        >
          <p className="text-base text-fuchsia-900 font-bold mb-2 flex items-center justify-center gap-2">
            <span className="text-xl leading-none">⚠️</span> Insufficient Coins
          </p>

          <p className="text-sm text-fuchsia-800/90 mb-5 leading-relaxed">
            You need more coins to place your bid of **${lastTriedAmount.toFixed(2)}**. 
            Please top up and try again.
          </p>

          <div className="flex justify-center">
            <AddCoinsButton initial={Math.max(1, Math.ceil(lastTriedAmount))} />
          </div>
        </div>
      )}
    </div>
  );
}