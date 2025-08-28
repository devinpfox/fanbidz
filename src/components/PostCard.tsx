// components/PostCard.tsx
// NOTE: Server component that renders your client children (EngagementRow, SaveButton, PostRightCTA, CommentsLink)

import SaveButton from "./SaveButton";
import EngagementRow from "./EngagementRow";
import PostRightCTA from "./PostRightCTA";
import CommentsLink from "./CommentsLink";

type Profile = { username: string | null; avatar: string | null };

export default function PostCard({
  cover,
  listingId,
  title,
  datePosted,
  category = "Sports Shoes",
  endAt,                  // string | null  (ISO) – for the "Expiring..." badge
  sold,                   // boolean | null
  profile,                // { username, avatar }
  currentUserId,          // string | null
  likeCount,
  commentCount,
  hasLiked,
  initialSaved,
  highestBid,             // number | null
  buyNow,                 // number | null
  walletBalance,          // number
  showDots = true,
  showHeaderFollow = true,
}: {
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
  walletBalance?: number;   // optional for now (PostRightCTA uses buyNow)
  showDots?: boolean;
  showHeaderFollow?: boolean;
}) {
  const ended = !!endAt && new Date(endAt).getTime() <= Date.now();

  return (
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
            <div className="text-xs text-gray-500">{category}</div>
          </div>
        </div>
        {showHeaderFollow && (
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Follow
          </button>
        )}
      </div>

      {/* Media */}
      <div className="relative mt-3">
        <img src={cover} alt={title ?? "Listing image"} className="w-full object-cover aspect-square" />

        {!!endAt && (
          <div className="absolute top-3 left-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">
            Expiring {Math.max(0, Math.floor((new Date(endAt).getTime() - Date.now()) / 1000))} Seconds!
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

      {/* Dots */}
      {showDots && (
        <div className="flex justify-center gap-2 py-3">
          <span className="h-1.5 w-8 rounded-full bg-black/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/20" />
        </div>
      )}

      <div className="px-4 pb-5">
        {/* Icons row */}
        <EngagementRow
          listingId={listingId}
          currentUserId={currentUserId}
          likeCount={likeCount}
          commentCount={commentCount}
          hasLiked={hasLiked}
          initialSaved={initialSaved}
          showViewAll={false}
        />

        {/* Fixed 2-col row (does not stack on mobile to match your design) */}
        <div className="mt-3 grid grid-cols-[1fr_230px] gap-4 items-start">
          {/* LEFT */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] sm:text-[22px] font-semibold leading-snug">{title}</h1>
              <span className="inline-flex items-center rounded-full bg-blue-600 text-white text-xs font-semibold px-2 py-0.5">
                New
              </span>
            </div>

            {/* <p className="mt-1 text-[15px] text-gray-800">{likeCount.toLocaleString()} Likes</p> */}

            <CommentsLink
              listingId={listingId}
              currentUserId={currentUserId}
              count={commentCount}
              className="mt-1"
            />
          </div>

          {/* RIGHT (CTA) */}
          <PostRightCTA
            listingId={listingId}
            userId={currentUserId}
            highestBid={highestBid}
            buyNow={buyNow}
            ended={ended || !!sold}
            category={category}
          />
        </div>

        {/* Date */}
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
