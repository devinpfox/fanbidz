// app/post/[id]/page.tsx
export const revalidate = 0;

import { cookies, headers } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../../../types/supabase";
import { notFound } from "next/navigation";
import BuyNowButton from "../../../components/BuyNowButton";
import EngagementRow from "../../../components/EngagementRow";
import PostRightCTA from "../../../components/PostRightCTA";
import SaveButton from "../../../components/SaveButton";
import CommentsLink from "../../../components/CommentsLink";


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


function formatTimeLeft(endAt: string): string {
  const secondsLeft = Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1000));

  if (secondsLeft < 60) {
    return `${secondsLeft} sec${secondsLeft !== 1 ? "s" : ""}`;
  } else if (secondsLeft < 3600) {
    const mins = Math.floor(secondsLeft / 60);
    return `${mins} min${mins !== 1 ? "s" : ""}`;
  } else if (secondsLeft < 86400) {
    const hrs = Math.floor(secondsLeft / 3600);
    return `${hrs} hour${hrs !== 1 ? "s" : ""}`;
  } else {
    const days = Math.floor(secondsLeft / 86400);
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
}

// Normalize a 1:1 relation
function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

type ProfileSel = { username: string | null; avatar: string | null };
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
};
type BidSel = { amount: number | null };
type LikeSel = { id: string };

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<DB>({ cookies: () => cookies() });
  const { id } = params;

  // Listing + creator
  const listingRes = await supabase
    .from("listings")
    .select(`
      id,
      title,
      images,
      buy_now,
      date_posted,
      user_id,
      end_at,
      sold,
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
  const buyNow = listing.buy_now != null ? Number(listing.buy_now) : null;

  // Lazy settle if ended
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
      }).catch(() => { });
    }
  }

  // Session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;

  // Wallet balance
  let walletBalance = 0;
  if (currentUserId) {
    const { data: w } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", currentUserId)
      .single();
    walletBalance = Number(w?.balance ?? 0);
  }

  // Highest bid
  const highestBidRes = await supabase
    .from("bids")
    .select("amount")
    .eq("listing_id", listing.id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle<BidSel>();
  const highestBid = highestBidRes.data ?? null;

  // Likes & comments
  const { count: likeCountRaw } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listing.id);
  const likeCount = likeCountRaw ?? 0;

  const { count: commentCountRaw } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listing.id);
  const commentCount = commentCountRaw ?? 0;

  // Has liked
  let hasLiked = false;
  if (currentUserId) {
    const likedRes = await supabase
      .from("likes")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("user_id", currentUserId)
      .maybeSingle<LikeSel>();
    hasLiked = !!likedRes.data;
  }

  // Initial saved
  let initialSaved = false;
  if (currentUserId) {
    const savedRes = await supabase
      .from("saves")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("user_id", currentUserId)
      .maybeSingle();
    initialSaved = !!savedRes.data;
  }

  const disableBidding = ended || !!listing.sold;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3">
            <img
              src={profile?.avatar ?? "https://i.pravatar.cc/64"}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="leading-tight">
              <div className="font-semibold text-[15px]">@{profile?.username ?? "user"}</div>
              <div className="text-xs text-gray-500">Sports Shoes</div>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Follow
          </button>
        </div>

        {/* Media */}
        <div className="relative mt-3">
          <img src={cover} alt={listing.title ?? "Listing image"} className="w-full object-cover aspect-square" />

          {listing.end_at && (
  <div className="absolute top-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
    Expiring {formatTimeLeft(listing.end_at)}
  </div>
)}


          <div className="absolute top-3 right-3 flex items-center gap-2">
            <SaveButton
              listingId={listing.id}
              userId={currentUserId}
              initialSaved={initialSaved}
              className="h-6 w-6 text-gray-700 hover:text-black"
            />
            <div className="rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
              Charity
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 py-3">
          <span className="h-1.5 w-8 rounded-full bg-black/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
        </div>

        <div className="px-4 pb-5">
        <EngagementRow
  listingId={listing.id}
  currentUserId={currentUserId}
  likeCount={likeCount}
  commentCount={commentCount}
  hasLiked={hasLiked}
  initialSaved={initialSaved}
  showViewAll={false}
/>

{/* Fixed 2-col row that does NOT stack on mobile */}
<div className="mt-3 grid grid-cols-[1fr_230px] gap-4 items-start">
  {/* LEFT */}
  <div>
    <div className="flex items-center gap-2">
      <h1 className="text-[20px] sm:text-[22px] font-semibold leading-snug">
        {listing.title}
      </h1>
      <span className="inline-flex items-center rounded-full bg-blue-600 text-white text-xs font-semibold px-2 py-0.5">
        New
      </span>
    </div>

    {/* <p className="mt-1 text-[15px] text-gray-800">
      {likeCount.toLocaleString()} Likes
    </p> */}

    {/* client-side link to open comments (no server onClick) */}
    <CommentsLink
  listingId={listing.id}
  currentUserId={currentUserId}   // <-- add this
  count={commentCount}
  className="mt-1"
/>
  </div>

  {/* RIGHT (CTA) */}
  <PostRightCTA
    listingId={listing.id}
    userId={currentUserId}
    highestBid={highestBid?.amount != null ? Number(highestBid.amount) : null}
    buyNow={buyNow}
    ended={disableBidding}
    category="Sports Shoes"
  />
</div>

{/* Date directly under the 2-col row */}
<div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M7 3v2M17 3v2M3 8h18M5 11h14M5 15h10" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
  {listing.date_posted ? new Date(listing.date_posted).toLocaleDateString() : ""}
</div>


        </div>
      </div>
    </div>
  );
}
