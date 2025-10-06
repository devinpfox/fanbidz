"use client";
import { useState } from "react";
import LiveCountdown from "./LiveCountdown";

type Listing = {
  id: string;
  title: string;
  image: string | null;
  buy_now: number | null;
  last_bid: number | null;
  seconds_left: number | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar: string | null;
  };
};

type ListingCardProps = {
  listing: Listing;
  likeCount: number;
  commentCount: number;
  initialLiked?: boolean;
  onLike?: (listingId: string, liked: boolean) => void;
};

export default function ListingCard({
  listing,
  likeCount,
  commentCount,
  initialLiked = false,
  onLike,
}: ListingCardProps) {
  const [liked, setLiked] = useState(initialLiked);

  const handleLike = () => {
    setLiked((prev) => !prev);
    if (onLike) onLike(listing.id, !liked);
  };

  return (
    <div className="mb-10 bg-white rounded-lg shadow w-full max-w-full overflow-hidden">
      <div className="relative w-full">
        <img
          src={listing.image ?? "https://via.placeholder.com/400x300"}
          alt="Product"
          className="w-full h-[340px] object-cover rounded-t-lg"
        />
        {listing.seconds_left != null && (
          <div className="absolute top-3 right-3">
            <LiveCountdown initialSeconds={listing.seconds_left} />
          </div>
        )}
      </div>
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <img
              src={listing.profiles?.avatar ?? "https://i.pravatar.cc/40"}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            <p className="text-sm font-medium">@{listing.profiles?.username}</p>
          </div>
          <p className="text-gray-500 text-sm">
            ${listing.buy_now?.toFixed(2) ?? "--"}
          </p>
        </div>
        <p className="font-semibold text-base">{listing.title}</p>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <button
            onClick={handleLike}
            className="flex items-center focus:outline-none"
            aria-label="Like"
            type="button"
          >
            <span className={liked ? "text-red-500" : "text-gray-400"}>
              {liked ? "❤️" : "🤍"}
            </span>
            <span className="ml-1">{likeCount + (liked ? 1 : 0)}</span>
          </button>
          <span>💬 {commentCount}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">
            💰 Last bid: ${listing.last_bid?.toFixed(2) ?? "0.00"}
          </span>
          <button className="px-4 py-1.5 bg-[rgb(255,78,207)] text-white rounded-full text-sm font-semibold hover:bg-blue-700">
            Place Bid →
          </button>
        </div>
      </div>
    </div>
  );
}
