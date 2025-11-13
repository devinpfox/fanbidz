export const dynamic = "force-dynamic";

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../../../types/supabase";
import Link from "next/link";

/** Same tiny shim as SaveButton */
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

// ---- Listing types ----
type Listing = { id: string; title: string | null; images: string[] | null };
type FavRow = { listing_id: string; created_at: string; listings: Listing | Listing[] | null };

function toListing(l: FavRow["listings"]): Listing | null {
  if (!l) return null;
  return Array.isArray(l) ? l[0] ?? null : l;
}
// ------------------------

export default async function FavoritesPage() {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<DB>({ cookies: () => cookieStore as any });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  /* ────────────────────────────────
      Not Logged In
  ───────────────────────────────── */
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20">
        <div className="max-w-2xl mx-auto px-6 pt-24 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Saved Items
          </h1>
          <p className="text-gray-500 text-sm">Please sign in to view your favorites.</p>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("saves")
    .select(`
      listing_id,
      created_at,
      listings:listing_id ( id, title, images )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as FavRow[]).filter((r) => r.listings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-24">

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-center h-16">
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Saved Items
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-8">

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm shadow-sm">
            Failed to load saved items.
          </div>
        )}

        {/* Empty State */}
        {!rows.length ? (
          <div className="mt-32 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path
                  d="M5 12l5 5L20 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-6 text-gray-600 font-medium">You haven’t saved anything yet.</p>
            <p className="text-gray-400 text-sm mt-1">Tap the ♥ icon on any listing to add it here.</p>
          </div>
        ) : (
          /* Grid of Saved Images */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4 mt-4 pb-12">
            {rows.map((r) => {
              const listing = toListing(r.listings);
              if (!listing) return null;

              return (
                <Link
                  key={r.listing_id}
                  href={`/post/${listing.id}`}
                  className="
                    group 
                    rounded-3xl 
                    overflow-hidden
                    backdrop-blur-xl 
                    bg-white/60 
                    border border-white/30 
                    shadow-lg shadow-black/5
                    hover:shadow-2xl hover:shadow-pink-500/20
                    transition-all
                  "
                >
                  <img
                    src={listing.images?.[0] ?? "https://via.placeholder.com/400"}
                    alt={listing.title ?? "Listing"}
                    className="
                      w-full 
                      aspect-square 
                      object-cover 
                      transition-all 
                      group-hover:scale-105
                    "
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
