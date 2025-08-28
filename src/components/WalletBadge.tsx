'use client';
import { useEffect, useState } from "react";

export default function WalletBadge({ initial }: { initial: number }) {
  const [balance, setBalance] = useState(initial);
  // (Optional) poll or subscribe later; MVP can just show initial.
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border">
      <span className="text-sm">Coins:</span>
      <span className="font-mono">{balance}</span>
    </div>
  );
}
