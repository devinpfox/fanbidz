"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";

type Props = {
  listingId: string;
  userId: string | null;
  hasLiked: boolean;
  likeCount: number;
};

export default function LikeButton({ listingId, userId, hasLiked, likeCount }: Props) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [liked, setLiked] = useState(hasLiked);
  const [count, setCount] = useState(likeCount);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    if (!userId) {
      router.push("/login");
      return;
    }
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    try {
      if (next) {
        const { error } = await supabase
          .from("likes")
          .insert({ listing_id: listingId, user_id: userId } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", userId);
        if (error) throw error;
      }
      startTransition(() => router.refresh());
    } catch {
      // revert on error
      setLiked(!next);
      setCount((c) => c - (next ? 1 : -1));
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="inline-flex items-center gap-2 mt-3 select-none"
      aria-pressed={liked}
      title={liked ? "Unlike" : "Like"}
    >
      <span className={`text-lg ${liked ? "text-rose-600" : "text-gray-500"}`}>♥</span>
      <span className="text-sm text-gray-600">{count}</span>
    </button>
  );
}
