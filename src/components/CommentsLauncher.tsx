"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";
import CommentSheet from "./CommentSheet";
import { MessageCircle } from "lucide-react";

export default function CommentsLauncher({
  listingId,
  initialCount = 0,
  currentUserIdFromServer,
}: {
  listingId: string;
  initialCount?: number;
  currentUserIdFromServer?: string | null;
}) {
  const supabase = createClientComponentClient<Database>();
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null | undefined>(currentUserIdFromServer);

  useEffect(() => {
    if (userId !== undefined) return;
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase, userId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-gray-600 hover:text-black"
      >
        <MessageCircle className="w-5 h-5" />
        {initialCount > 0 && (
          <span className="text-sm">{initialCount}</span>
        )}
      </button>

      {isOpen && (
        <CommentSheet
          listingId={listingId}
          currentUserId={userId ?? null}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
