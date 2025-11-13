// components/PostRightCTA.tsx
"use client";

import { useState } from "react";
import PlaceBid from "./PlaceBid";
import BuyNowButton from "./BuyNowButton";

export default function PostRightCTA({
  listingId,
  userId,
  highestBid,
  buyNow,
  ended,
  category = "Sports Shoes",
  hideBidButton = false, // New prop
}: {
  listingId: string;
  userId: string | null;
  highestBid: number | null;
  buyNow: number | null;
  ended: boolean;
  category?: string;
  hideBidButton?: boolean; // New prop interface
}) {
  const [open, setOpen] = useState(false);

  const lastBidAmount = highestBid != null ? `$${highestBid.toFixed(2)}` : null;
  const buyNowAmount  = buyNow != null ? `$${buyNow.toFixed(2)}` : "—";
  const lastBidText = highestBid != null ? `$${highestBid.toFixed(2)}` : "—"; // For modal use

  return (
    // Space-y-2 instead of space-y-3 to tighten the last bid/buy now grouping
    <div className="flex flex-col items-end text-right space-y-2 w-full">
      
      {/* LAST BID: Aligned to the top of the grid cell */}
      {highestBid !== null && (
        <div className="text-right shrink-0">
          <div className="text-sm text-gray-500 font-medium">Last Bid</div>
          <div className="text-xl font-bold text-gray-900">{lastBidAmount}</div>
        </div>
      )}

      {/* Buy Now Button - Styled as a black pill button */}
      {buyNow != null && (
        <BuyNowButton
          listingId={listingId}
          buyNow={buyNow}
          userId={userId}
          ended={ended}
          className="
            w-full max-w-[140px]
            p-3
            bg-black
            text-white text-base font-semibold 
            rounded-2xl
            shadow-lg shadow-gray-900/10 
            hover:bg-gray-800 transition-colors
            disabled:opacity-50
          "
        >
          Buy Now ${buyNow}
        </BuyNowButton>
      )}

      {/* Bid Button (Pink) - RENDERED ONLY IF hideBidButton IS FALSE */}
      {!hideBidButton && (
          <div className="pt-1">
            <button
              type="button"
              disabled={!userId || ended}
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(255,78,207)] px-6 py-3 text-white text-base font-semibold shadow-sm disabled:opacity-50 w-[140px]"
            >
              Bid <span aria-hidden>→</span>
            </button>
            {(ended || !userId) && (
              <p className="text-xs text-gray-500 mt-1 text-right">
                {ended ? "This item is sold." : "Sign in to place a bid."}
              </p>
            )}
          </div>
      )}

      {/* Modal/Sheet Content (No change) */}
      {open && (
        <>
          <div className="fixed inset-0 z-[180] bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[200] sm:inset-0">
            <div
              className="mx-auto w-full max-w-sm sm:max-w-md sm:mt-24 rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">Place a Bid</h3>
                <button onClick={() => setOpen(false)} className="text-2xl leading-none px-2">×</button>
              </div>
              <PlaceBid listingId={listingId} userId={userId} />
              <p className="mt-2 text-xs text-gray-500">
                Highest bid: {lastBidText}
                {buyNow != null && ` · Buy Now: ${buyNowAmount}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}