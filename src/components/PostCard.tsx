'use client';

import { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import SaveButton from './SaveButton';
import EngagementRow from './EngagementRow';
import PostRightCTA from './PostRightCTA';
import CommentsLink from './CommentsLink';
import PostMediaCarousel from './PostMediaCarousel';
import CountdownBadge from "@/components/CountdownBadgeWrapper";
import Link from "next/link";

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
  useEffect(() => {
    if (datePosted) {
      setLocalDate(new Date(datePosted).toLocaleDateString());
    }
  }, [datePosted]);

  return (
    <div className="
      group
      relative
      bg-gradient-to-b from-white to-gray-50/30
      rounded-[32px]
      overflow-hidden
      border border-gray-200/60
      shadow-[0_8px_30px_rgb(0,0,0,0.04)]
      hover:shadow-[0_20px_60px_rgb(236,72,153,0.15),0_8px_30px_rgb(0,0,0,0.08)]
      transition-all duration-500 ease-out
      hover:-translate-y-1
    ">
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/[0.02] via-transparent to-pink-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header (No Change) */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 opacity-90 shadow-lg shadow-pink-500/25" />
            <div className="relative p-[3px] bg-white rounded-full">
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
              className="block font-bold text-[15px] text-gray-900 hover:text-fuchsia-600 transition-colors duration-200"
            >
              @{profile?.username ?? "user"}
            </Link>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{category}</div>
          </div>
        </div>
        {showHeaderFollow && (
          <button
            type="button"
            className="
              relative overflow-hidden
              px-5 py-2
              text-sm font-bold
              rounded-full
              bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500
              text-white
              shadow-lg shadow-pink-500/30
              hover:shadow-xl hover:shadow-pink-500/40
              hover:scale-105 active:scale-95
              transition-all duration-300
              before:absolute before:inset-0
              before:bg-gradient-to-r before:from-fuchsia-600 before:via-pink-600 before:to-rose-600
              before:opacity-0 hover:before:opacity-100
              before:transition-opacity before:duration-300
            "
          >
            <span className="relative z-10">Follow</span>
          </button>
        )}
      </div>

      {/* Media (No Change) */}
      <div className="relative mt-4">
        <PostMediaCarousel images={imgs} showDots={showDots} />
        {endAt && (
          <div className="absolute top-3 left-3">
            <CountdownBadge endAt={endAt} />
          </div>
        )}
      </div>

      {/* Content: RESTRUCTURED for stability and bottom row */}
      <div className="relative px-6 pb-6 pt-4 space-y-4">
        
        {/* Engagement Row (No Change) */}
        <EngagementRow
          listingId={listingId}
          currentUserId={currentUserId}
          likeCount={likeCount}
          commentCount={commentCount}
          hasLiked={hasLiked}
          initialSaved={initialSaved}
          showViewAll={false}
        />

        {/* 1. Top Section (Title/Category vs. Last Bid/Buy Now) - GRID */}
        <div className="grid grid-cols-2 gap-x-4 items-start"> 
          
          {/* Left Column: Title & Category (using flex-col to stack) */}
          <div className="flex flex-col"> 
            
            {/* Title row: Name + NEW badge (added whitespace-nowrap to prevent wrapping on the title line) */}
            <div className="flex items-center gap-2.5 whitespace-nowrap overflow-hidden"> 
              <h1 className="text-[21px] sm:text-[23px] font-bold text-gray-900 leading-tight tracking-tight truncate">
                {title}
              </h1>
              <span className="
                inline-flex items-center shrink-0
                rounded-full
                bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500
                text-white
                text-[10px] font-bold uppercase tracking-wider
                px-2.5 py-1
                shadow-md shadow-pink-500/30
              ">
                New
              </span>
            </div>

            {/* Category */}
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide mt-1">{category}</span>
          </div>

          {/* Right Column: Last Bid & Buy Now Button - PostRightCTA Handles these now */}
          <PostRightCTA
            listingId={listingId}
            userId={currentUserId}
            highestBid={highestBid}
            buyNow={buyNow}
            ended={sold || false}
            category={category}
            hideBidButton={true} // New prop to hide the final Bid button here
          />
        </div>

        {/* 2. Bottom Section (Date vs. Bid Button) - FLEX for guaranteed bottom alignment */}
        <div className="flex justify-between items-end mt-4">

            {/* Date stamp */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-50 to-pink-50">
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
              <span className="text-xs font-medium text-gray-500" suppressHydrationWarning>
                {localDate || "\u00A0"}
              </span>
            </div>
          
            {/* Bid Button - Rendered here using a dedicated component/logic, NOT PostRightCTA */}
            <div className="pt-1">
                <button
                    type="button"
                    // You need to pass these props or handle disabling logic here if not using PostRightCTA
                    // disabled={!currentUserId || sold}
                    // onClick={() => openBidModal()} 
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[rgb(255,78,207)] px-6 py-3 text-white text-base font-semibold shadow-sm disabled:opacity-50 w-[140px]"
                >
                    Bid <span aria-hidden>→</span>
                </button>
            </div>
            {/* NOTE: If you need the bid button logic (onClick/disabled) to come from PostRightCTA, we must refactor PostRightCTA to return individual pieces instead of a single block. */}
        </div>

      </div>
    </div>
  );
});

export default PostCard;