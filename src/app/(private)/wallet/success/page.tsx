// app/wallet/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function WalletSuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get('session_id');
  const returnUrl = sp.get('returnUrl');
  const [msg, setMsg] = useState(
    sessionId ? "We're updating your wallet..." : 'No session id found.'
  );

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/wallet/confirm?session_id=${sessionId}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok) {
          setMsg('Wallet updated! Redirecting...');
          // Use returnUrl from query params if available
          const destination = returnUrl || '/wallet';
          setTimeout(() => router.push(destination), 800);
        } else {
          setMsg(data.error || 'Could not confirm deposit.');
        }
      } catch {
        setMsg('Network error confirming deposit.');
      }
    })();
  }, [sessionId, returnUrl, router]);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-semibold">Payment Success</h1>
      <p className="mt-2 text-gray-600">{msg}</p>
      <p className="mt-6">
        <a className="underline" href="/wallet">Go to Wallet</a>
      </p>
    </div>
  );
}
