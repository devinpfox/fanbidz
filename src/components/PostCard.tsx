'use client';

import { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import SaveButton from './SaveButton';
import EngagementRow from './EngagementRow'; // Assuming this is the correct path
import PostRightCTA from './PostRightCTA';
import CommentsLink from './CommentsLink';
import PostMediaCarousel from './PostMediaCarousel';
import CountdownBadge from "@/components/CountdownBadgeWrapper";
import PlaceBid from "./PlaceBid"; // Import PlaceBid
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // Import Supabase client
import type { Database } from "../../types/supabase"; // Import Database type
import FlipNumber from "./FlipNumber"; // Import FlipNumber

type Profile = { username: string | null; avatar: string | null };

interface PostCardProps {
  images?: string[];
  cover: string;
  listingId: string;
  title: string | null;
  datePosted: string | null;
  category?: string;
  endAt: string | null;
  sold: boolean | null;
  profile: Profile | null;
  currentUserId: string | null;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  initialSaved: boolean;
  highestBid: number | null;
  buyNow: number | null;
  walletBalance?: number;
  showDots?: boolean;
  showHeaderFollow?: boolean;
}

const getInitialDateString = (dateStr: string | null) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toDateString();
  } catch {
    return '';
  }
};

const PostCard = memo(function PostCard({
  images,
  cover,
  listingId,
  title,
  datePosted,
  category = 'Sports Shoes',
  endAt,
  sold,
  profile,
  currentUserId,
  likeCount,
  commentCount,
  hasLiked,
  initialSaved,
  highestBid,
  buyNow,
  walletBalance,
  showDots = true,
  showHeaderFollow = true,
}: PostCardProps) {

  const imgs = (images?.length ? images : [cover]).filter(Boolean) as string[];

  const [localDate, setLocalDate] = useState<string>(getInitialDateString(datePosted));
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [liveHighestBid, setLiveHighestBid] = useState<number | null>(highestBid); // Local state for real-time bid

  useEffect(() => {
    if (datePosted) {
      setLocalDate(new Date(datePosted).toLocaleDateString());
    }
  }, [datePosted]);

  // Sync local state with initial prop whenever the prop changes
  useEffect(() => {
    setLiveHighestBid((prev) => {
      if (prev === null || highestBid === null) {
        return highestBid;
      }
      return Math.max(prev, highestBid);
    });
  }, [highestBid]);

  // REALTIME SUBSCRIPTION for PostCard
  useEffect(() => {
    const supabase = createClientComponentClient<Database>();

    const channel = supabase
      .channel(`bids-listen-${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newBid = payload.new as any;
          const newBidAmount = newBid.amount ?? 0;
          setLiveHighestBid((prev) =>
            prev != null ? Math.max(prev, newBidAmount) : newBidAmount
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId]);

  return (
    <div
      className="
        group relative overflow-hidden rounded-[32px]
        bg-white/90
        border border-white/50
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        hover:shadow-[0_18px_50px_rgba(255,78,207,0.18)]
        transition-all duration-500 ease-out
        hover:-translate-y-1
      "
    >
      {/* Subtle luxury sheen */}
      <div
        className="
          absolute inset-0 pointer-events-none
          bg-gradient-to-br from-white/50 via-transparent to-white/20
          opacity-0 group-hover:opacity-100
          transition-opacity duration-700
        "
      />
  
      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-3">
        <div className="flex items-center gap-3.5">
  
          {/* Classier avatar ring */}
          <div className="relative">
            {/* Soft luxury glow */}
            <div
              className="
                absolute inset-0 rounded-full
                bg-gradient-to-br from-fuchsia-400/40 via-pink-400/25 to-rose-400/40
                opacity-40
              "
            />
  
            {/* Crisp white border ring */}
            <div
              className="
                relative p-[3px] rounded-full
                bg-white/95 border border-white/50
                shadow-md shadow-pink-500/20
              "
            >
              <Image
                src={profile?.avatar ?? 'https://i.pravatar.cc/64'}
                alt="User Avatar"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
  
          <div className="leading-tight space-y-0.5">
            <Link
              href={`/${profile?.username ?? ""}`}
              className="block font-semibold text-[15px] text-gray-900 tracking-tight hover:text-fuchsia-600 transition-colors"
            >
              @{profile?.username ?? "user"}
            </Link>
         
          </div>
        </div>
 
      </div>
  
      {/* Media */}
      <div className="relative mt-4">
        {/* Soft gradient glow behind media (no blur) */}
        <div
          className="
            absolute -inset-3 rounded-3xl pointer-events-none
            bg-gradient-to-br from-fuchsia-300/20 via-pink-300/15 to-rose-300/20
            opacity-40
          "
        />
  
        <PostMediaCarousel images={imgs} showDots={showDots} />
  
        {endAt && (
          <div className="absolute top-3 left-3">
            <CountdownBadge endAt={endAt} />
          </div>
        )}
      </div>
  
      {/* Content */}
      <div className="relative px-6 pb-6 pt-4 space-y-4">
  
        {/* Engagement */}
        <EngagementRow
          listingId={listingId}
          currentUserId={currentUserId}
          likeCount={likeCount}
          commentCount={commentCount}
          hasLiked={hasLiked}
          initialSaved={initialSaved}
          showViewAll={false}
        />
  
        {/* Title & CTA row */}
        <div className="grid grid-cols-2 gap-x-4 items-start">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 whitespace-nowrap overflow-hidden">
              <h1 className="text-[21px] sm:text-[23px] font-semibold text-gray-900 leading-tight tracking-tight truncate">
                {title}
              </h1>
              <span
                className="
                  inline-flex items-center shrink-0 rounded-full
                  bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500
                  text-white text-[10px] font-bold uppercase tracking-wider
                  px-2.5 py-1 shadow-md shadow-pink-500/30
                "
              >
                New
              </span>
            </div>
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide mt-1">
              {category}
            </span>
          </div>
  
          <PostRightCTA
            listingId={listingId}
            userId={currentUserId}
            highestBid={liveHighestBid} // Pass liveHighestBid
            buyNow={buyNow}
            ended={sold || false}
            category={category}
            hideBidButton={true}
          />
        </div>
  
        {/* Footer bar */}
        <div className="flex justify-between items-end mt-4">

{/* Date stamp */}
<div className="flex items-center gap-2">
  <div
    className="
      flex items-center justify-center w-7 h-7 rounded-lg
      bg-gradient-to-br from-fuchsia-50 to-pink-50
    "
  >
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-fuchsia-600">
      <path
        d="M7 3v2M17 3v2M3 8h18M5 11h14M5 15h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  </div>

  <span
    className="text-xs font-medium text-gray-500"
    suppressHydrationWarning
  >
    {localDate || "\u00A0"}
  </span>
</div>

{/* Bid Button – no background bar, no border, no shadow */}
<button
  type="button"
  disabled={!currentUserId || sold || false}
  onClick={() => setBidModalOpen(true)}
  className="
    inline-flex items-center justify-center gap-2
    rounded-2xl px-6 py-3 w-[140px]
    text-white text-base font-semibold
    bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500
    hover:scale-[1.03] active:scale-95
    transition-transform
    disabled:opacity-50 disabled:scale-100
  "
>
  Bid →
</button>

</div>
      </div>

      {/* Bid Modal */}
      {bidModalOpen && (
        <>
          {/* Fade overlay */}
          <div
            className="fixed inset-0 z-[180] bg-black/40"
            onClick={() => setBidModalOpen(false)}
          />

          {/* Modal card */}
          <div className="fixed inset-x-0 bottom-0 z-[200] sm:inset-0">
            <div
              className="
                mx-auto w-full max-w-sm sm:max-w-md
                sm:mt-24 rounded-t-2xl sm:rounded-2xl
                bg-white shadow-2xl p-5
              "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Place a Bid
                </h3>
                <button
                  onClick={() => setBidModalOpen(false)}
                  className="text-2xl leading-none px-2 text-gray-600 hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <PlaceBid listingId={listingId} userId={currentUserId} setLiveHighestBid={setLiveHighestBid} />

              <p className="mt-3 text-xs text-gray-500">
                Highest bid: {liveHighestBid !== null ? (
                  <FlipNumber value={liveHighestBid} prefix="$" decimals={2} className="inline" />
                ) : "—"}
                {buyNow != null && ` · Buy Now: $${buyNow.toFixed(2)}`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );

});

export default PostCard;
