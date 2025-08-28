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
}: {
  listingId: string;
  userId: string | null;
  highestBid: number | null;
  buyNow: number | null;
  ended: boolean;
  category?: string;
}) {
  const [open, setOpen] = useState(false);

  const lastBidText = highestBid != null ? `$${highestBid.toFixed(2)}` : "—";
  const buyNowText  = buyNow != null ? `$${buyNow.toFixed(2)}` : "—";

  return (
    <div className="flex flex-col items-end text-right space-y-3 w-full">
      <p className="text-[18px] text-gray-400 font-medium">{category}</p>

      <div className="space-y-1.5">
        <p className="text-[18px] text-gray-700">
          <span className="text-gray-500">Last Bid </span>
          <span className="font-semibold text-gray-900">{lastBidText}</span>
        </p>

        {buyNow != null && (
          <BuyNowButton
            listingId={listingId}
            buyNow={buyNow}
            userId={userId}
            ended={ended}
            className="p-0 bg-transparent underline underline-offset-2 text-[18px] text-gray-400 hover:text-gray-600 disabled:text-gray-300"
          >
            Buy Now {buyNowText}
          </BuyNowButton>
        )}
      </div>

      <div className="pt-1">
        <button
          type="button"
          disabled={!userId || ended}
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-white text-base font-semibold shadow-sm disabled:opacity-50 w-[140px]"
        >
          Bid <span aria-hidden>→</span>
        </button>
        {(ended || !userId) && (
          <p className="text-xs text-gray-500 mt-1 text-right">
            {ended ? "This item is sold." : "Sign in to place a bid."}
          </p>
        )}
      </div>

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
                {buyNow != null && ` · Buy Now: ${buyNowText}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
