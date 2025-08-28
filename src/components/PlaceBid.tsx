'use client';

import { useState, useTransition } from "react";
import AddCoinsButton from "@/components/AddCoinsButton";

interface Props {
  listingId: string;
  userId: string | null;
}

export default function PlaceBid({ listingId, userId }: Props) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [lastTriedAmount, setLastTriedAmount] = useState<number>(10);

  const placeBid = async () => {
    if (!userId) {
      setMessage("Please log in to place a bid.");
      return;
    }

    const bidValue = parseFloat(amount);
    if (isNaN(bidValue) || bidValue <= 0) {
      setMessage("Enter a valid bid amount.");
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
        setAmount("");
        setMessage("✅ Bid placed successfully!");
        setShowTopUp(false);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to place bid. Try again.");
    }
  };

  return (
    <div className="mt-6 border-t pt-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Enter bid"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <button
          onClick={() => startTransition(placeBid)}
          disabled={isPending}
          className="bg-black text-white px-4 py-2 rounded hover:opacity-90"
        >
          {isPending ? "Bidding..." : "Place Bid"}
        </button>
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      {showTopUp && (
        <div className="rounded border p-3">
          <p className="text-sm mb-2">
            You don’t have enough coins for this bid. Add coins below and try again.
          </p>
          <AddCoinsButton initial={Math.max(1, Math.ceil(lastTriedAmount))} />
        </div>
      )}
    </div>
  );
}
