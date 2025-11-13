// app/(private)/page.tsx
import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase"; // ← Full Database
import PostCard from "../../components/PostCard.client";
import HomePageClient from "./HomePageClient";

export const revalidate = 120;

// Use the generated helper types!
type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
type ListingsRow = Database["public"]["Tables"]["listings"]["Row"];
type LikesRow = Database["public"]["Tables"]["likes"]["Row"];
type CommentsRow = Database["public"]["Tables"]["comments"]["Row"];
type SavesRow = Database["public"]["Tables"]["saves"]["Row"];

// Select only what we need
type ProfileSelect = Pick<ProfilesRow, "username" | "avatar">;
type FirstTimeProfile = Pick<ProfilesRow, "first_time" | "role">;

type ListingWithProfile = ListingsRow & {
  profiles: ProfileSelect | ProfileSelect[] | null;
};

type ListingIdRow = { listing_id: string | null | undefined };

const PAGE_SIZE = 6;

function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function HomePage() {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // ---- Auth ----
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // ---- First Time Flow (NOW TYPE-SAFE!) ----
// ---- First Time Flow (NOW TYPE-SAFE!) ----
let showTutorial = false;

if (userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_time, role")
    .eq("id", userId)
    .single<FirstTimeProfile>();

  if (profile?.first_time === true) {
    showTutorial = true;
  }
}

  // ---- Listings with Profile Join ----
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
      profiles:profiles!user_id (username, avatar)
    `)
    .eq("sold", false)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)
    .returns<ListingWithProfile[]>(); // ← Type-safe

  if (error) {
    console.error("Error loading listings:", error.message);
    return (
      <div className="p-6 text-red-500 bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 min-h-screen flex items-center justify-center">
        Failed to load listings
      </div>
    );
  }

  if (!listRows || listRows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 flex items-center justify-center">
        <p className="text-gray-600 text-lg">No listings yet.</p>
      </div>
    );
  }

  const listings = listRows;
  const ids = listings.map((l) => l.id);

  // ---- Aggregation: Likes, Comments, User Actions ----
  const [
    { data: likesAll },
    { data: commentsAll },
    { data: userLikes },
    { data: userSaves },
  ] = await Promise.all([
    supabase
      .from("likes")
      .select("listing_id")
      .in("listing_id", ids)
      .returns<ListingIdRow[]>(),

    supabase
      .from("comments")
      .select("listing_id")
      .in("listing_id", ids)
      .returns<ListingIdRow[]>(),

    userId
      ? supabase
          .from("likes")
          .select("listing_id")
          .eq("user_id", userId)
          .in("listing_id", ids)
          .returns<ListingIdRow[]>()
      : Promise.resolve({ data: [] as ListingIdRow[] }),

    userId
      ? supabase
          .from("saves")
          .select("listing_id")
          .eq("user_id", userId)
          .in("listing_id", ids)
          .returns<ListingIdRow[]>()
      : Promise.resolve({ data: [] as ListingIdRow[] }),
  ]);

  // Build maps
  const likeCountMap = new Map<string, number>();
  const commentCountMap = new Map<string, number>();
  const userLikedSet = new Set<string>();
  const userSavedSet = new Set<string>();

  (likesAll ?? []).forEach((row) => {
    if (row.listing_id) {
      likeCountMap.set(row.listing_id, (likeCountMap.get(row.listing_id) ?? 0) + 1);
    }
  });

  (commentsAll ?? []).forEach((row) => {
    if (row.listing_id) {
      commentCountMap.set(row.listing_id, (commentCountMap.get(row.listing_id) ?? 0) + 1);
    }
  });

  (userLikes ?? []).forEach((row) => {
    if (row.listing_id) userLikedSet.add(row.listing_id);
  });

  (userSaves ?? []).forEach((row) => {
    if (row.listing_id) userSavedSet.add(row.listing_id);
  });

  // ---- Enhance Listings ----
  const now = Date.now();

  const safeListings = listings.map((l) => {
    const profile = one(l.profiles);
    const endTime = l.end_at ? new Date(l.end_at).getTime() : 0;
    const sold = endTime > 0 && endTime <= now;
    const secondsLeft = endTime > 0 ? Math.max(0, Math.floor((endTime - now) / 1000)) : null;
  
    return {
      ...l,
      profile,
      sold,
      secondsLeft,
      likeCount: likeCountMap.get(l.id) ?? 0,
      commentCount: commentCountMap.get(l.id) ?? 0,
    };
  });
  
  // NEW → Hide ended auctions
  const activeListings = safeListings.filter((l) => !l.sold);
  // ---- Render Feed ----
  return (
    <HomePageClient showTutorial={showTutorial}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-24">
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="space-y-10">
            {activeListings.map((listing) => (
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