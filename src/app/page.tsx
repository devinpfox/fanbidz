// app/page.tsx
export const revalidate = 0;

import { cookies as nextCookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../types/supabase";
import PostCard from "../components/PostCard";

/* -------- DB shim so .from("saves") type-checks -------- */
type DB = GenDB & {
  public: GenDB["public"] & {
    Tables: GenDB["public"]["Tables"] & {
      saves: {
        Row: { id?: string; listing_id: string; user_id: string; created_at?: string };
        Insert: { listing_id: string; user_id: string; created_at?: string };
        Update: { listing_id?: string; user_id?: string; created_at?: string };
      };
    };
  };
};

/* ---------- helpers & types ---------- */
type Profile = { username: string | null; avatar: string | null };
type Listing = {
  id: string;
  title: string | null;
  images: string[] | null;
  buy_now: number | null;
  last_bid: number | null;
  seconds_left: number | null;
  created_at: string;
  user_id: string;
  profiles: Profile | Profile[] | null;
};
type IdRow = { listing_id: string | null };

function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

/* --------------- page ---------------- */
export default async function HomePage() {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<DB>({ cookies: () => cookieStore as any });

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const userId = user.id;

  // Wallet
  const { data: w } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();
  const walletBalance = Number(w?.balance ?? 0);

  // Listings with creator
  const { data: listRows, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      images,
      buy_now,
      last_bid,
      seconds_left,
      created_at,
      user_id,
      profiles:profiles!user_id (
        username,
        avatar
      )
    `)
    .eq("sold", false)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-6 text-red-500">Failed to load listings</div>;
  }
  const listings = (listRows ?? []) as Listing[];

  // Aggregate counts + my like/save flags (typed)
  const [likesAll, commentsAll, likesMine, savesMine] = await Promise.all([
    supabase.from("likes").select("listing_id").returns<IdRow[]>(),
    supabase.from("comments").select("listing_id").returns<IdRow[]>(),
    supabase.from("likes").select("listing_id").eq("user_id", userId).returns<IdRow[]>(),
    supabase.from("saves").select("listing_id").eq("user_id", userId).returns<IdRow[]>(),
  ]).then(([a, b, c, d]) => [a.data ?? [], b.data ?? [], c.data ?? [], d.data ?? []]);

  const likeCountMap = new Map<string, number>();
  for (const row of likesAll) {
    const id = row.listing_id;
    if (!id) continue;
    likeCountMap.set(id, (likeCountMap.get(id) || 0) + 1);
  }

  const commentCountMap = new Map<string, number>();
  for (const row of commentsAll) {
    const id = row.listing_id;
    if (!id) continue;
    commentCountMap.set(id, (commentCountMap.get(id) || 0) + 1);
  }

  const likedSet = new Set<string>(likesMine.map((r) => r.listing_id!).filter(Boolean));
  const savedSet = new Set<string>(savesMine.map((r) => r.listing_id!).filter(Boolean));

  // Render the SAME card layout as /post/[id]
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {listings.map((listing) => {
        const profile = one(listing.profiles);
        const highestBid = typeof listing.last_bid === "number" ? Number(listing.last_bid) : null;
        const buyNow = typeof listing.buy_now === "number" ? Number(listing.buy_now) : null;

        const endAt =
          listing.seconds_left != null
            ? new Date(Date.now() + listing.seconds_left * 1000).toISOString()
            : null;

        return (
          <PostCard
            key={listing.id}
            cover={listing.images?.[0] ?? "https://via.placeholder.com/800"}
            listingId={listing.id}
            title={listing.title}
            datePosted={listing.created_at}
            category="Sports Shoes"
            endAt={endAt}
            sold={false}
            profile={profile}
            currentUserId={userId}
            likeCount={likeCountMap.get(listing.id) ?? 0}
            commentCount={commentCountMap.get(listing.id) ?? 0}
            hasLiked={likedSet.has(listing.id)}
            initialSaved={savedSet.has(listing.id)}
            highestBid={highestBid}
            buyNow={buyNow}
            walletBalance={walletBalance}
            showDots
            showHeaderFollow
          />
        );
      })}
    </div>
  );
}
