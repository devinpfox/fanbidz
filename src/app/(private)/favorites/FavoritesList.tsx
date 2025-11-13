"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import type { Database as GenDB } from "../../../../types/supabase";

// Type definitions (copied from the original page)
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
type Listing = { id: string; title: string | null; images: string[] | null };
type FavRow = { listing_id: string; created_at: string; listings: Listing | Listing[] | null };

function toListing(l: FavRow["listings"]): Listing | null {
  if (!l) return null;
  return Array.isArray(l) ? l[0] ?? null : l;
}

export default function FavoritesList({
  initialRows,
  userId,
}: {
  initialRows: FavRow[];
  userId: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const supabase = createClientComponentClient<DB>();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-saves:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "saves",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch the full listing details for the new save
          const { data } = await supabase
            .from("listings")
            .select("id, title, images")
            .eq("id", payload.new.listing_id)
            .single();
          
          if (data) {
            const newRow: FavRow = {
              listing_id: payload.new.listing_id,
              created_at: payload.new.created_at,
              listings: data as Listing,
            };
            // Add to list and sort to maintain order
            setRows((prev) => [...prev, newRow].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "saves",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setRows((prev) => prev.filter((r) => r.listing_id !== payload.old.listing_id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  if (!rows.length) {
    return (
      <div className="mt-32 text-center">
        <div className="mx-auto w-24 h-24 rounded-full bg-white/70 border border-white/40 shadow-xl shadow-black/5 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-6 text-gray-600 font-medium">You haven’t saved anything yet.</p>
        <p className="text-gray-400 text-sm mt-1">Tap the bookmark icon on any listing to add it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4 mt-4 pb-12">
      {rows.map((r) => {
        const listing = toListing(r.listings);
        if (!listing) return null;

        return (
          <Link
            key={r.listing_id}
            href={`/post/${listing.id}`}
            className="group rounded-3xl overflow-hidden bg-white/80 border border-white/50 shadow-md shadow-black/5 hover:shadow-xl hover:shadow-pink-500/10 transition-all"
          >
            <img
              src={listing.images?.[0] ?? 'https://via.placeholder.com/400'}
              alt={listing.title ?? 'Listing'}
              className="w-full aspect-square object-cover transition-all group-hover:brightness-110"
            />
          </Link>
        );
      })}
    </div>
  );
}
