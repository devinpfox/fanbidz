"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../types/supabase";

type DB = GenDB & {
  public: GenDB["public"] & {
    Tables: GenDB["public"]["Tables"] & {
      saves: {
        Row: { id: string; user_id: string; listing_id: string; created_at: string };
        Insert: { user_id: string; listing_id: string; created_at?: string };
        Update: { user_id?: string; listing_id?: string; created_at?: string };
      };
    };
  };
};

export default function SaveButton({
  listingId,
  userId,
  initialSaved = false,
  className = "",
}: {
  listingId: string;
  userId?: string | null;
  initialSaved?: boolean;
  className?: string;
}) {
  const supabase = createClientComponentClient<DB["public"]>();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!userId || busy) return;
    setBusy(true);
    try {
      if (!saved) {
        const { error } = await supabase.from("saves").insert([{ listing_id: listingId, user_id: userId }]);
        if (error) throw error;
        setSaved(true);
      } else {
        const { error } = await supabase
          .from("saves")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", userId);
        if (error) throw error;
        setSaved(false);
      }
    } catch (e: any) {
      alert(e.message ?? "Unable to update saved state");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!userId || busy}
      aria-pressed={saved}
      title={saved ? "Unsave" : "Save"}
      className={`text-gray-600 hover:text-black ${className}`}
    >
      {/* Bookmark icon */}
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
      </svg>
    </button>
  );
}
