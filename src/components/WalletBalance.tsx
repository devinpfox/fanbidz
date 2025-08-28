"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function WalletBalance({ className = "" }: { className?: string }) {
  const supabase = useSupabaseClient();
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.warn("getUser error:", userErr?.message);
      if (!user) { if (mounted) setCoins(0); return; }

      // initial fetch
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) console.warn("wallet fetch error:", error.message);
      if (mounted) setCoins(data?.balance ?? 0);

      // realtime: listen for INSERT/UPDATE on this user's wallet row
      channel = supabase
        .channel(`wallet-balance-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const next = (payload.new as any)?.balance;
            if (typeof next === "number") setCoins(next);
          }
        )
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") console.debug("wallet channel:", status);
        });
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (coins === null) return <span className={className}>Balance: …</span>;
  return <span className={className}>Balance: {coins} coins</span>;
}
