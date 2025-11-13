'use client';

import { useEffect, useState } from 'react';
import { formatTimeLeft } from '@/lib/formatTimeLeft';

export default function CountdownBadge({ endAt }: { endAt: string }) {
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endAt) return;

    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      setMsRemaining(Math.max(0, diff));
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  if (msRemaining === null) return null;

  const display = formatTimeLeft(msRemaining);

  return (
    <div
      className="
        rounded-lg 
        bg-white/95 
        px-3 
        py-1 
        text-xs 
        font-semibold 
        shadow-sm
        whitespace-nowrap      /* <-- IMPORTANT FIX */
        max-w-none             /* <-- Prevent shrink */
      "
    >
      {display === 'Ended' ? 'Auction ended' : display}
    </div>
  );
}
