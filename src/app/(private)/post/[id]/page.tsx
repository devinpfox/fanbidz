export const revalidate = 0;
export const dynamic = "force-dynamic"; // ✅ ensures cookies() and params() are fresh per request

import { cookies, headers } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../../../../types/supabase";
import { notFound } from "next/navigation";
import Image from "next/image"; 

import type { Database } from "../../../../../types/supabase";
import PostCard from "../../../../components/PostCard"; 

// --- (Existing Types remain unchanged) ---
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

function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

type ProfileSel = { username: string | null; avatar: string | null };
// UPDATED: Added last_bid to the ListingSel type
type ListingSel = {
  id: string;
  title: string | null;
  images: string[] | null;
  buy_now: number | null;
  date_posted: string | null;
  user_id: string;
  end_at: string | null;
  sold: boolean | null;
  profiles: ProfileSel | ProfileSel[] | null;
  last_bid: number | null; // <--- ADDED
};
// REMOVED: type BidSel = { amount: number | null }; (No longer needed)
type LikeSel = { id: string };

// --- (PostPage component) ---
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });
  
  // Listing + creator data fetch
  const listingRes = await supabase
    .from("listings")
    // IMPORTANT: Include 'last_bid' in the select statement
    .select(`
      id,
      title,
      images,
      buy_now,
      date_posted,
      user_id,
      end_at,
      sold,
      last_bid,
      profiles:profiles!user_id (
        username,
        avatar
      )
    `)
    .eq("id", id)
    .maybeSingle<ListingSel>();

  if (listingRes.error || !listingRes.data) return notFound();

  const listing = listingRes.data;
  const profile = one(listing.profiles);
  const cover = listing.images?.[0] ?? "https://via.placeholder.com/800";
  const category = "Sports Shoes"; 
  const buyNow = listing.buy_now != null ? Number(listing.buy_now) : null;
  const images = listing.images ?? undefined; 

  // Lazy settle logic
  const ended = !!listing.end_at && new Date(listing.end_at).getTime() <= Date.now();
  if (ended && !listing.sold) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const base = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : "");
    if (base) {
      fetch(`${base}/api/auction/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: id }),
        cache: "no-store",
      }).catch(() => {});
    }
  }

  // Auth and parallel queries
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const [
    walletRes,
    // highestBidRes, <--- REMOVED from the Promise.all array
    likeCountRes,
    commentCountRes,
    likedRes,
    savedRes,
  ] = await Promise.all([
    currentUserId
      ? supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", currentUserId)
          .maybeSingle<{ balance: number | null }>()
      : Promise.resolve({ data: null }),
    // REMOVED the separate 'bids' query block
    supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listing.id),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listing.id),
    currentUserId
      ? supabase
          .from("likes")
          .select("id")
          .eq("listing_id", listing.id)
          .eq("user_id", currentUserId)
          .maybeSingle<LikeSel>()
      : Promise.resolve({ data: null }),
    currentUserId
      ? supabase
          .from("saves")
          .select("id")
          .eq("listing_id", listing.id)
          .eq("user_id", currentUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const walletBalance = Number(walletRes.data?.balance ?? 0);
  // highestBid is now fetched directly on the listing object
  const likeCount = likeCountRes.count ?? 0;
  const commentCount = commentCountRes.count ?? 0;
  const hasLiked = !!likedRes.data;
  const initialSaved = !!savedRes.data;

  // --------------------------------------------------------
  // ✅ RENDER POSTCARD COMPONENT
  // --------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <PostCard
        images={images}
        cover={cover}
        listingId={listing.id}
        title={listing.title}
        datePosted={listing.date_posted}
        category={category}
        endAt={listing.end_at}
        sold={listing.sold}
        profile={profile}
        currentUserId={currentUserId}
        likeCount={likeCount}
        commentCount={commentCount}
        hasLiked={hasLiked}
        initialSaved={initialSaved}
        
        // Use the reliable 'last_bid' field, defaulting to 0
        highestBid={listing.last_bid ?? 0}
        
        buyNow={buyNow}
        walletBalance={walletBalance}
        showDots={false} 
        showHeaderFollow={true}
      />
    </div>
  );
}