// app/(private)/page.tsx
import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../../types/supabase";
import PostCard from "../../components/PostCard.client";
import HomePageClient from "./HomePageClient";

export const revalidate = 120;

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
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<DB>({
    cookies: () => cookieStore as any,
  });

  // ---- Auth ----
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // ---- First Time Flow ----
  let showTutorial = false;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_time, role")
      .eq("id", userId)
      .single();

    showTutorial = profile?.first_time === true && profile?.role === "consumer";
  }

  // ---- Listings ----
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
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error) {
    console.error("Error loading listings:", error.message);
    return (
      <div className="p-6 text-red-500 bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 min-h-screen flex items-center justify-center">
        Failed to load listings
      </div>
    );
  }

  const listings = (listRows ?? []) as Listing[];
  const ids = listings.map((l) => l.id);

  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 flex items-center justify-center">
        <p className="text-gray-600 text-lg">No listings yet.</p>
      </div>
    );
  }

  // ---- Aggregation ----
  const [likesAllRes, commentsAllRes, userLikesRes, userSavesRes] =
    await Promise.all([
      supabase.from("likes").select("listing_id").in("listing_id", ids),
      supabase.from("comments").select("listing_id").in("listing_id", ids),
      userId
        ? supabase
            .from("likes")
            .select("listing_id")
            .eq("user_id", userId)
            .in("listing_id", ids)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase
            .from("saves")
            .select("listing_id")
            .eq("user_id", userId)
            .in("listing_id", ids)
        : Promise.resolve({ data: [] }),
    ]);

  const likesAll = likesAllRes.data ?? [];
  const commentsAll = commentsAllRes.data ?? [];
  const userLikes = userLikesRes.data ?? [];
  const userSaves = userSavesRes.data ?? [];

  const likeCountMap = new Map<string, number>();
  const commentCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();
  const userSavedSet = new Set<string>();

  for (const row of likesAll) {
    if (row.listing_id)
      likeCountMap.set(
        row.listing_id,
        (likeCountMap.get(row.listing_id) || 0) + 1
      );
  }

  for (const row of commentsAll) {
    if (row.listing_id)
      commentCountMap.set(
        row.listing_id,
        (commentCountMap.get(row.listing_id) || 0) + 1
      );
  }

  for (const row of userLikes) {
    if (row.listing_id) userLikedSet.add(row.listing_id);
  }
  for (const row of userSaves) {
    if (row.listing_id) userSavedSet.add(row.listing_id);
  }

  // ---- Stable props ----
  const now = Date.now();

  const safeListings = listings.map((l) => {
    const profile = one(l.profiles);
    const sold = l.end_at ? new Date(l.end_at).getTime() <= now : false;
    const secondsLeft = l.end_at
      ? Math.max(
          0,
          Math.floor((new Date(l.end_at).getTime() - now) / 1000)
        )
      : null;

    return {
      ...l,
      profile,
      sold,
      secondsLeft,
      likeCount: likeCountMap.get(l.id) ?? 0,
      commentCount: commentCountMap.get(l.id) ?? 0,
    };
  });

  // ---- FEED UI ----
  return (
    <HomePageClient showTutorial={showTutorial}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-24">

        <div className="max-w-3xl mx-auto px-4 pt-8">
          {/* SPACE BETWEEN POSTCARDS */}
          <div className="space-y-10">
            {safeListings.map((listing) => (
              <PostCard
                key={listing.id}
                cover={listing.images?.[0] ?? "https://via.placeholder.com/800"}
                listingId={listing.id}
                title={listing.title}
                datePosted={listing.created_at}
                category="Sports Shoes"
                endAt={listing.end_at}
                sold={listing.sold}
                profile={listing.profile}
                currentUserId={userId}
                likeCount={listing.likeCount}
                commentCount={listing.commentCount}
                hasLiked={userLikedSet.has(listing.id)}
                initialSaved={userSavedSet.has(listing.id)}
                highestBid={listing.last_bid ?? null}
                buyNow={listing.buy_now ?? null}
                showDots
                showHeaderFollow
              />
            ))}
          </div>
        </div>
      </div>
    </HomePageClient>
  );
}
