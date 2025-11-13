"use client";

import { useState, memo } from "react";
import LikeButton from "./LikeButton";
import CommentSheet from "./CommentSheet";
import { MessageCircle } from "lucide-react";
import SaveButton from "./SaveButton";

const EngagementRow = memo(function EngagementRow({
  listingId,
  currentUserId,
  likeCount,
  commentCount,
  hasLiked,
  initialSaved = false,
  showViewAll = true,
}: {
  listingId: string;
  currentUserId: string | null;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  initialSaved?: boolean;
  showViewAll?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-6 text-gray-600">
        {/* Like */}
        <LikeButton
          listingId={listingId}
          userId={currentUserId}
          hasLiked={hasLiked}
          likeCount={likeCount}
        />

        {/* Comment */}
        <button
          type="button"
          aria-label="Open comments"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 hover:text-black transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
          {commentCount > 0 && <span className="text-sm font-medium">{commentCount}</span>}
        </button>

        {/* Save (bookmark icon only) */}
        <SaveButton
          listingId={listingId}
          userId={currentUserId}
          initialSaved={initialSaved}
          className="h-6 w-6 text-gray-600 hover:text-black transition-all duration-200 hover:scale-110 active:scale-95"
        />
      </div>
  
      {showViewAll && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm text-gray-700 font-medium underline text-left transition-all duration-200 hover:text-fuchsia-600 hover:translate-x-1"
        >
          View all {commentCount.toLocaleString()} comments
        </button>
      )}
  
      {open && (
        <CommentSheet
          listingId={listingId}
          currentUserId={currentUserId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
});

export default EngagementRow;
