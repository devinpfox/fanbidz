// components/CommentsLink.tsx
"use client";
import { useState } from "react";
import CommentSheet from "./CommentSheet";

export default function CommentsLink({
  listingId,
  currentUserId,
  count,
  className = "",
}: {
  listingId: string;
  currentUserId: string | null;
  count: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* <button type="button" onClick={() => setOpen(true)} className={className}>
        View all {count.toLocaleString()} comments
      </button> */}
      {open && (
        <CommentSheet
          listingId={listingId}
          currentUserId={currentUserId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}