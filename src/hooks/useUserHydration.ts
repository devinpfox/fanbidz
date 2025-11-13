'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase';

export function useUserHydration() {
  const supabase = createClientComponentClient<Database>();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single() as any;
      if (wallet?.balance != null) setWalletBalance(Number(wallet.balance));

      // Fetch liked and saved listings for this user
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('likes').select('listing_id').eq('user_id', user.id) as any,
        supabase.from('saves').select('listing_id').eq('user_id', user.id) as any,
      ]);
      setLikedSet(new Set((likes ?? []).map((r: any) => r.listing_id)));
      setSavedSet(new Set((saves ?? []).map((r: any) => r.listing_id)));
    })();
  }, []);

  return {
    walletBalance,
    likedSet,
    savedSet,
    userId,
  };
}
