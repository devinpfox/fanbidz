'use client';

import { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import SaveButton from './SaveButton';
import EngagementRow from './EngagementRow';
import PostRightCTA from './PostRightCTA';
import CommentsLink from './CommentsLink';
import PostMediaCarousel from './PostMediaCarousel';

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

// --- Stable SSR date formatting ---
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

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const initialTimeDiff = endAt ? new Date(endAt).getTime() - Date.now() : 0;
  const initialSecondsLeft = Math.max(0, Math.floor(initialTimeDiff / 1000));

  const [secondsLeft, setSecondsLeft] = useState<number>(initialSecondsLeft);
  const [ended, setEnded] = useState(initialSecondsLeft <= 0);

  useEffect(() => {
    if (!hydrated || !endAt) return;

    const updateTime = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(diff / 1000));
      setSecondsLeft(secs);
      setEnded(secs <= 0);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [endAt, hydrated]);

  const [localDate, setLocalDate] = useState<string>(getInitialDateString(datePosted));

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (datePosted) {
        setLocalDate(new Date(datePosted).toLocaleDateString());
      }
    });
    return () => cancelAnimationFrame(id);
  }, [datePosted]);

  const initialCountdown = endAt
    ? `Ends in ${Math.floor(initialSecondsLeft / 60)}m ${initialSecondsLeft % 60}s`
    : null;

  const countdownText = `Ends in ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`;

  return (
    <div className="
      backdrop-blur-2xl 
      bg-white/70 
      rounded-3xl 
      shadow-xl 
      shadow-black/5 
      border 
      border-white/20 
      overflow-hidden 
      transition-all 
      hover:shadow-2xl 
      hover:shadow-pink-500/20 
      hover:bg-white/80
    ">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          
          {/* Avatar w/ Gradient Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400 via-pink-400 to-rose-400 rounded-full blur opacity-40"></div>
            <div className="relative p-[2px] bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-full">
              <Image
                src={profile?.avatar ?? 'https://i.pravatar.cc/64'}
                alt="User Avatar"
                width={42}
                height={42}
                className="w-11 h-11 rounded-full object-cover bg-white ring-2 ring-white"
              />
            </div>
          </div>

          <div className="leading-tight">
            <div className="font-semibold text-[15px] text-gray-900">
              @{profile?.username ?? 'user'}
            </div>
            <div className="text-xs text-gray-500">{category}</div>
          </div>
        </div>

        {/* Luxury Follow Button */}
        {showHeaderFollow && (
          <button
            type="button"
            className="
              px-4 
              py-1.5 
              text-sm 
              font-semibold 
              rounded-xl 
              bg-gradient-to-r 
              from-fuchsia-500 
              to-pink-500 
              text-white 
              shadow-md 
              shadow-pink-400/30 
              hover:scale-105 
              active:scale-95 
              transition-all
            "
          >
            Follow
          </button>
        )}
      </div>

      {/* Media */}
      <div className="relative mt-4">
        <PostMediaCarousel images={imgs} showDots={showDots} />

        {!ended && secondsLeft > 0 && (
          <div
            className="
              absolute 
              top-3 left-3 
              rounded-xl 
              bg-white/90 
              backdrop-blur 
              px-3 py-1.5 
              text-xs 
              font-semibold 
              shadow-md
            "
            suppressHydrationWarning
          >
            {hydrated ? countdownText : initialCountdown}
          </div>
        )}

        {ended && (
          <div className="
            absolute 
            top-3 left-3 
            rounded-xl 
            bg-white/90 
            backdrop-blur 
            px-3 py-1.5 
            text-xs 
            font-semibold 
            shadow-md
          ">
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

          <div className="
            rounded-xl 
            bg-gradient-to-r 
            from-fuchsia-500/90 
            to-pink-500/90 
            text-white 
            px-3 py-1 
            text-xs 
            font-semibold 
            shadow-md 
            shadow-pink-400/20
          ">
            Charity
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-6 pt-4">

        <EngagementRow
          listingId={listingId}
          currentUserId={currentUserId}
          likeCount={likeCount}
          commentCount={commentCount}
          hasLiked={hasLiked}
          initialSaved={initialSaved}
          showViewAll={false}
        />

        <div className="mt-4 grid gap-4 items-start sm:grid-cols-[1fr_220px]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] sm:text-[22px] font-semibold text-gray-900">
                {title}
              </h1>

              <span className="
                inline-flex 
                items-center 
                rounded-xl 
                bg-gradient-to-r 
                from-fuchsia-500 
                to-pink-500 
                text-white 
                text-xs 
                font-semibold 
                px-2 py-0.5
              ">
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

        <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d="M7 3v2M17 3v2M3 8h18M5 11h14M5 15h10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>

          <span suppressHydrationWarning>
            {localDate || "\u00A0"}
          </span>
        </div>

      </div>
    </div>
  );
});

export default PostCard;
