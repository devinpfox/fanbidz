import { cookies as nextCookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../types/supabase";
import PostCard from "../components/PostCard";

/** Revalidate every 5 seconds */
export const revalidate = 5;

/* ---------- Types ---------- */
type DB = GenDB;
type Profile = { username: string | null; avatar: string | null };
type Listing = {
  id: string;
  title: string | null;
  images: string[] | null;
  buy_now: number | null;
  last_bid: number | null;
  seconds_left: number | null;
  created_at: string;
  end_at: string | null;
  user_id: string;
  profiles: Profile | Profile[] | null;
};
type IdRow = { listing_id: string | null };

function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

const PAGE_SIZE = 6;

export default async function HomePage() {
  const cookieStore = nextCookies();
  const supabase = createServerComponentClient<DB>({ cookies: () => cookieStore as any });

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Listings (paged)
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
    end_at,
    profiles:profiles!user_id ( username, avatar )
  `)
  .eq("sold", false)
  .order("created_at", { ascending: false })  // 👈 fix here
  .limit(PAGE_SIZE);


  if (error) {
    return <div className="p-6 text-red-500">Failed to load listings</div>;
  }

  const listings = (listRows ?? []) as Listing[];
  const ids = listings.map((l) => l.id);

  if (ids.length === 0) {
    return <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">No listings yet.</div>;
  }

  // Aggregate counts
  const [likesAllRes, commentsAllRes] = await Promise.all([
    supabase.from("likes").select("listing_id").in("listing_id", ids).returns<IdRow[]>(),
    supabase.from("comments").select("listing_id").in("listing_id", ids).returns<IdRow[]>(),
  ]);

  const likesAll = likesAllRes.data ?? [];
  const commentsAll = commentsAllRes.data ?? [];

  const likeCountMap = new Map<string, number>();
  const commentCountMap = new Map<string, number>();

  for (const row of likesAll) {
    if (row.listing_id) {
      likeCountMap.set(row.listing_id, (likeCountMap.get(row.listing_id) || 0) + 1);
    }
  }

  for (const row of commentsAll) {
    if (row.listing_id) {
      commentCountMap.set(row.listing_id, (commentCountMap.get(row.listing_id) || 0) + 1);
    }
  }

  const likedSet = new Set<string>();  // hydrated client-side
  const savedSet = new Set<string>();  // hydrated client-side

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {listings.map((listing) => {
        const profile = one(listing.profiles);

        return (
          <PostCard
            key={listing.id}
            cover={listing.images?.[0] ?? "https://via.placeholder.com/800"}
            listingId={listing.id}
            title={listing.title}
            datePosted={listing.created_at}
            category="Sports Shoes"
            endAt={listing.end_at}
            sold={false}
            profile={profile}
            currentUserId={userId}
            likeCount={likeCountMap.get(listing.id) ?? 0}
            commentCount={commentCountMap.get(listing.id) ?? 0}
            hasLiked={likedSet.has(listing.id)}
            initialSaved={savedSet.has(listing.id)}
            highestBid={listing.last_bid ?? null}
            buyNow={listing.buy_now ?? null}
            showDots
            showHeaderFollow
          />
        );
      })}
    </div>
  );
}
