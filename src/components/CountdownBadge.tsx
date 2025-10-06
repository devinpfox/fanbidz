'use client';

import { useEffect, useState } from 'react';

export default function CountdownBadge({ endAt }: { endAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endAt) return;

    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  if (secondsLeft === null) return null;

  let display = `${secondsLeft}s`;
  if (secondsLeft >= 86400) {
    display = `${Math.floor(secondsLeft / 86400)}d`;
  } else if (secondsLeft >= 3600) {
    display = `${Math.floor(secondsLeft / 3600)}h`;
  } else if (secondsLeft >= 60) {
    display = `${Math.floor(secondsLeft / 60)}m`;
  }

  return (
    <div className="absolute top-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
      {secondsLeft === 0 ? 'Auction ended' : `Ends in ${display}`}
    </div>
  );
}
