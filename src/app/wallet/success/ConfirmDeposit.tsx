'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ConfirmDeposit() {
  const sp = useSearchParams();
  const sessionId = sp.get('session_id');
  const [msg, setMsg] = useState('Confirming deposit...');

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/wallet/confirm?session_id=${sessionId}`, { cache: 'no-store' });
        const data = await res.json();
        setMsg(res.ok ? 'Wallet updated! You can close this tab.' : (data.error || 'Could not confirm deposit.'));
      } catch {
        setMsg('Network error confirming deposit.');
      }
    })();
  }, [sessionId]);

  return <p className="mt-2 text-sm text-gray-600">{msg}</p>;
}
