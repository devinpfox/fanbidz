'use client';

import { useEffect, useState } from 'react';
import SaveButton from './SaveButton';
import EngagementRow from './EngagementRow';
import PostRightCTA from './PostRightCTA';
import CommentsLink from './CommentsLink';
import PostMediaCarousel from './PostMediaCarousel';

type Profile = { username: string | null; avatar: string | null };

export default function PostCard({
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
}: {
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
}) {
  const imgs = (images?.length ? images : [cover]).filter(Boolean) as string[];

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!endAt) return;

    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)));
    };

    tick(); // initial
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  const ended = secondsLeft === 0 || (!!endAt && new Date(endAt).getTime() <= Date.now());

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <img
            src={profile?.avatar ?? 'https://i.pravatar.cc/64'}
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="leading-tight">
            <div className="font-semibold text-[15px]">@{profile?.username ?? 'user'}</div>
            <div className="text-xs text-gray-500">{category}</div>
          </div>
        </div>
        {showHeaderFollow && (
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium rounded-full bg-[rgb(255,78,207)] text-white hover:bg-blue-700 transition"
          >
            Follow
          </button>
        )}
      </div>

      {/* Media (carousel) */}
      <div className="relative">
        <PostMediaCarousel images={imgs} showDots={showDots} />

        {secondsLeft !== null && !ended && (
          <div className="absolute top-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
            Ends in {Math.floor(secondsLeft / 60)}m {secondsLeft % 60}s
          </div>
        )}

        {ended && (
          <div className="absolute top-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
            Auction ended
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <SaveButton
            listingId={listingId}
            userId={currentUserId}
            initialSaved={initialSaved}
            className="h-6 w-6 text-gray-700 hover:text-black"
          />
          <div className="rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">Charity</div>
        </div>
      </div>

      <div className="px-4 pb-5">
        <EngagementRow
          listingId={listingId}
          currentUserId={currentUserId}
          likeCount={likeCount}
          commentCount={commentCount}
          hasLiked={hasLiked}
          initialSaved={initialSaved}
          showViewAll={false}
        />

<div className="mt-3 grid gap-4 items-start sm:grid-cols-[1fr_230px]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] sm:text-[22px] font-semibold leading-snug">{title}</h1>
              <span className="inline-flex items-center rounded-full bg-[rgb(255,78,207)] text-white text-xs font-semibold px-2 py-0.5">
                New
              </span>
            </div>

            <CommentsLink
              listingId={listingId}
              currentUserId={currentUserId}
              count={commentCount}
              className="mt-1"
            />
          </div>

          <PostRightCTA
            listingId={listingId}
            userId={currentUserId}
            highestBid={highestBid}
            buyNow={buyNow}
            ended={ended || !!sold}
            category={category}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M7 3v2M17 3v2M3 8h18M5 11h14M5 15h10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {datePosted ? new Date(datePosted).toLocaleDateString() : ""}
        </div>
      </div>
    </div>
  );
}
