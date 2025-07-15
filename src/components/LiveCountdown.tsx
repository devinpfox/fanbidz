'use client';
import { useEffect, useState } from 'react';

interface Props {
  initialSeconds: number;
}

export default function LiveCountdown({ initialSeconds }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <span className="bg-white/90 text-xs px-3 py-1 rounded-full shadow font-medium">
      {minutes}:{seconds} left
    </span>
  );
}
