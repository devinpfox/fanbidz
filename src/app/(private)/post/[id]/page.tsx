export const revalidate = 0;
export const dynamic = "force-dynamic"; // ✅ ensures cookies() and params() are fresh per request

import { cookies, headers } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database as GenDB } from "../../../../../types/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import BuyNowButton from "../../../../components/BuyNowButton";
import EngagementRow from "../../../../components/EngagementRow";
import PostRightCTA from "../../../../components/PostRightCTA";
import SaveButton from "../../../../components/SaveButton";
import CommentsLink from "../../../../components/CommentsLink";
import CountdownBadge from "../../../../components/CountdownBadgeWrapper";
import type { Database } from "../../../../../types/supabase"; 

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

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ await both params and cookies
  const { id } = await params;
  const cookieStore = await cookies();

  // ✅ create Supabase client with awaited cookies
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });
  
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

  // ✅ Lazy settle if ended
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

  // ✅ Secure auth call
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // ⚡ PARALLELIZE all queries that depend on currentUserId and listing.id
  const [
    walletRes,
    highestBidRes,
    likeCountRes,
    commentCountRes,
    likedRes,
    savedRes,
  ] = await Promise.all([
    // Wallet balance
    currentUserId
      ? supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", currentUserId)
          .maybeSingle<{ balance: number | null }>()
      : Promise.resolve({ data: null }),
    // Highest bid
    supabase
      .from("bids")
      .select("amount")
      .eq("listing_id", listing.id)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle<BidSel>(),
    // Likes count
    supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listing.id),
    // Comments count
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listing.id),
    // Has liked
    currentUserId
      ? supabase
          .from("likes")
          .select("id")
          .eq("listing_id", listing.id)
          .eq("user_id", currentUserId)
          .maybeSingle<LikeSel>()
      : Promise.resolve({ data: null }),
    // Initial saved
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
  const highestBid = highestBidRes.data ?? null;
  const likeCount = likeCountRes.count ?? 0;
  const commentCount = commentCountRes.count ?? 0;
  const hasLiked = !!likedRes.data;
  const initialSaved = !!savedRes.data;

  const disableBidding = ended || !!listing.sold;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3">
            <Image
              src={profile?.avatar ?? "https://i.pravatar.cc/64"}
              alt="User Avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              unoptimized={profile?.avatar?.startsWith('https://i.pravatar.cc')}
            />
            <div className="leading-tight">
              <div className="font-semibold text-[15px]">@{profile?.username ?? "user"}</div>
              <div className="text-xs text-gray-500">Sports Shoes</div>
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium rounded-full bg-[rgb(255,78,207)] text-white hover:bg-blue-700 transition"
          >
            Follow
          </button>
        </div>

        {/* Media */}
        <div className="relative mt-3">
          <Image
            src={cover}
            alt={listing.title ?? "Listing image"}
            width={800}
            height={800}
            className="w-full object-cover aspect-square"
            priority
          />

          {listing.end_at && <CountdownBadge endAt={listing.end_at} />}

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

          {/* 2-column layout */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_230px] gap-4 items-start">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] sm:text-[22px] font-semibold leading-snug">
                  {listing.title}
                </h1>
                <span className="inline-flex items-center rounded-full bg-[rgb(255,78,207)] text-white text-xs font-semibold px-2 py-0.5">
                  New
                </span>
              </div>

              <CommentsLink
                listingId={listing.id}
                currentUserId={currentUserId}
                count={commentCount}
                className="mt-1"
              />
            </div>

            <PostRightCTA
              listingId={listing.id}
              userId={currentUserId}
              highestBid={highestBid?.amount ?? null}
              buyNow={buyNow}
              ended={disableBidding}
              category="Sports Shoes"
            />
          </div>

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
