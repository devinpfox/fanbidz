"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";
import PlaceBid from "./PlaceBid";
import BuyNowButton from "./BuyNowButton";
import FlipNumber from "./FlipNumber"; // Import FlipNumber

export default function PostRightCTA({
  listingId,
  userId,
  highestBid,
  buyNow,
  ended,
  category = "Sports Shoes",
  hideBidButton = false,
}: {
  listingId: string;
  userId: string | null;
  highestBid: number | null;
  buyNow: number | null;
  ended: boolean;
  category?: string;
  hideBidButton?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // ⭐ Local state (real-time)
  const [liveHighestBid, setLiveHighestBid] = useState<number | null>(highestBid);

  // ⭐ Sync local state with initial prop whenever the prop changes
  useEffect(() => {
    // Only update the live state if the incoming prop is higher
    // (This prevents the real-time update from being overwritten by old prop data)
    setLiveHighestBid((prev) => {
      if (prev === null || highestBid === null) {
        return highestBid;
      }
      return Math.max(prev, highestBid);
    });
  }, [highestBid]); // Run whenever the initial highestBid prop changes

  // ⭐ REALTIME SUBSCRIPTION
  useEffect(() => {
    const supabase = createClientComponentClient<Database>();

    const channel = supabase
      .channel(`bids-listen-${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newBid = payload.new as any;
          const newBidAmount = newBid.amount ?? 0;

          // This logic remains correct for handling real-time inserts
          setLiveHighestBid((prev) =>
            prev != null ? Math.max(prev, newBidAmount) : newBidAmount
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId]);

  // Use liveHighestBid for display
  const lastBidText = liveHighestBid != null ? `$${liveHighestBid.toFixed(2)}` : "—";

  return (
    <div className="flex flex-col items-end text-right space-y-2 w-full">

      {/* LAST BID */}
      {liveHighestBid !== null && (
        <div className="text-right shrink-0">
          <div className="text-sm text-gray-500 font-medium tracking-wide">
            Last Bid
          </div>
          <div className="text-xl font-semibold text-gray-900 tracking-tight">
            <FlipNumber value={liveHighestBid} prefix="$" decimals={2} />
          </div>
        </div>
      )}

      {/* BUY NOW */}
      {buyNow != null && (
        <BuyNowButton
          listingId={listingId}
          buyNow={buyNow}
          userId={userId}
          ended={ended}
          className="
            w-full max-w-[140px] px-4 py-3 rounded-2xl
            bg-gradient-to-b from-black to-gray-900
            text-white text-base font-semibold
            shadow-[0_4px_16px_rgba(0,0,0,0.25)]
            hover:shadow-[0_6px_22px_rgba(0,0,0,0.35)]
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Buy Now ${buyNow}
        </BuyNowButton>
      )}

      {/* BID BUTTON */}
      {!hideBidButton && (
        <div className="pt-1">
          <button
            type="button"
            disabled={!userId || ended}
            onClick={() => setOpen(true)}
            className="
              inline-flex items-center justify-center gap-2
              rounded-2xl px-6 py-3 w-[140px]
              text-white text-base font-semibold
              bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500
              shadow-lg shadow-pink-500/25
              hover:shadow-pink-500/40 hover:scale-[1.03]
              active:scale-95
              transition-all duration-300
              disabled:opacity-50 disabled:scale-100
            "
          >
            Bid →
          </button>

          {(ended || !userId) && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              {ended ? "This item is sold." : "Sign in to place a bid."}
            </p>
          )}
        </div>
      )}

      {/* MODAL */}
      {open && (
        <>
          {/* Fade overlay */}
          <div
            className="fixed inset-0 z-[180] bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Modal card */}
          <div className="fixed inset-x-0 bottom-0 z-[200] sm:inset-0">
            <div
              className="
                mx-auto w-full max-w-sm sm:max-w-md
                sm:mt-24 rounded-t-2xl sm:rounded-2xl
                bg-white shadow-2xl p-5
              "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Place a Bid
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-2xl leading-none px-2 text-gray-600 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <PlaceBid listingId={listingId} userId={userId} setLiveHighestBid={setLiveHighestBid} />

              <p className="mt-3 text-xs text-gray-500">
                Highest bid: {liveHighestBid !== null ? (
                  <FlipNumber value={liveHighestBid} prefix="$" decimals={2} className="inline" />
                ) : "—"}
                {buyNow != null && ` · Buy Now: $${buyNow.toFixed(2)}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
