export const dynamic = "force-dynamic";

import { cookies as nextCookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../../types/supabase";

/** same tiny type shim as in SaveButton */
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

// ---- ADD THIS HELPER + TYPE ----
type Listing = { id: string; title: string | null; images: string[] | null };
type FavRow = { listing_id: string; created_at: string; listings: Listing | Listing[] | null };

function toListing(l: FavRow["listings"]): Listing | null {
  if (!l) return null;
  return Array.isArray(l) ? l[0] ?? null : l;
}
// --------------------------------

export default async function FavoritesPage() {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<DB>({ cookies: () => cookieStore as any });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("saves")
    .select(`
      listing_id,
      created_at,
      listings:listing_id ( id, title, images )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // cast into FavRow so TS knows about our shim
  const rows = ((data ?? []) as FavRow[]).filter((r) => r.listings);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Saved</h1>

      {error && <p className="text-sm text-red-600 mb-4">Failed to load saved items.</p>}

      {!rows.length ? (
        <p className="text-sm text-gray-500">You haven’t saved anything yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-[2px]">
          {rows.map((r) => {
            const listing = toListing(r.listings);
            if (!listing) return null;
            return (
              <Link
                key={r.listing_id}
                href={`/post/${listing.id}`}
                className="block bg-black hover:opacity-90 transition"
              >
                <img
                  src={listing.images?.[0] ?? "https://via.placeholder.com/400"}
                  alt={listing.title ?? "Listing"}
                  className="w-full aspect-square object-cover"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
