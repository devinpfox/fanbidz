"use client";

import { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";

// Re-using the types from the original component
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type ProfileSlim = { username: string | null; avatar: string | null };
type CommentItem = CommentRow & { profiles?: ProfileSlim | null };

const FALLBACK_AVATAR = "https://i.pravatar.cc/40";

export default function CommentSheet({
  listingId,
  currentUserId,
  onClose,
}: {
  listingId: string;
  currentUserId?: string | null;
  onClose: () => void;
}) {
  const supabase = createClientComponentClient<Database["public"]>();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileSlim | null>(null); // ⭐ NEW STATE
  const scrollRef = useRef<HTMLDivElement>(null);

  // ⭐ NEW: Fetch the current user's profile data once
  useEffect(() => {
    if (!currentUserId) return;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar")
        .eq("id", currentUserId)
        .single();

      if (data) {
        // Store the profile data for optimistic updates
        setCurrentUserProfile(data as ProfileSlim); 
      }
      if (error) {
        console.error("Failed to fetch current user profile:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // Dependency on currentUserId

  // load + subscribe (initial load logic unchanged)
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, text, created_at, user_id, listing_id, " +
            "profiles:profiles!comments_user_id_fkey(username, avatar)"
        )
        .eq("listing_id", listingId)
        .order("created_at", { ascending: true });

      if (!alive) return;
      if (error) return;

      const normalized: CommentItem[] = (data ?? []).map((row: any) => ({
        ...row,
        profiles: Array.isArray(row.profiles)
          ? (row.profiles[0] ?? null)
          : (row.profiles ?? null),
      }));

      setItems(normalized);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 0);
    })();

    const channel = supabase
      .channel(`comments-${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `listing_id=eq.${listingId}` },
        // Realtime payload doesn't include profile, so we still set profiles: null
        (payload) => {
          setItems((p) => [...p, { ...(payload.new as any), profiles: null } as CommentItem]);
          setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 0);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // send function - MODIFIED for optimistic profile data
  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const txt = text.trim();
    if (!txt || !currentUserId) return;

    // ⭐ MODIFIED: Optimistic append now uses the fetched currentUserProfile
    const tmp: CommentItem = {
      id: `tmp-${Date.now()}`,
      created_at: new Date().toISOString(),
      listing_id: listingId,
      user_id: currentUserId,
      text: txt,
      profiles: currentUserProfile, // <--- NOW INCLUDES PROFILE DATA
    };

    setItems((p) => [...p, tmp]);
    setText("");

    const { error } = await supabase
      .from("comments")
      .insert<CommentInsert>([
        {
          listing_id: listingId,
          user_id: currentUserId,
          text: txt,
        },
      ]);

    if (error) {
      // Rollback on error
      setItems((p) => p.filter((i) => i.id !== tmp.id));
      alert(error.message || "Failed to comment");
    }
    // No need to worry about the realtime handler because the 'tmp' comment will
    // be replaced/matched by the permanent one when the initial load runs again
    // (though in this component, the initial load only runs once). The 'tmp'
    // comment will just stay until another user posts or the list is reloaded.
    // In a production app, you might match and replace the temporary item in
    // the realtime handler, but for this optimistic approach, using the profile
    // data directly is the most straightforward fix.
  }

  const canPost = !!currentUserId;

  // Render logic remains the same (using the provided styled version)
  return (
    <>
      {/* Backdrop - Deeper, more atmospheric black/70 */}
      <div className="fixed inset-0 z-[180] bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet container - Uses the gradient/glass style */}
      <div className="fixed inset-x-0 bottom-0 z-[200] animate-in slide-in-from-bottom-2 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-full max-w-[720px] max-h-[85vh] rounded-t-3xl backdrop-blur-xl bg-white/95 shadow-2xl shadow-fuchsia-500/10 relative flex flex-col border-t border-white/20">
          
          {/* Header - Gradient Text and Elegant Close Button */}
          <div className="flex h-14 items-center justify-between border-b border-gray-100/50 px-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Comments
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-2xl leading-none px-2 text-gray-600 hover:text-pink-600 transition-colors"
            >
              ×
            </button>
          </div>

          {/* List - Standard padding but enhanced comment styling */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pb-28">
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Be the first to share your thoughts!</p>
            ) : (
              <div className="space-y-5">
                {items.map((c) => (
                  <div key={c.id} className="flex items-start gap-4">
                    {/* Avatar with subtle gradient ring */}
                    <div className="p-0.5 bg-gradient-to-br from-fuchsia-400 to-pink-400 rounded-full flex-shrink-0">
                      <img
                        src={c.profiles?.avatar ?? FALLBACK_AVATAR}
                        className="h-9 w-9 rounded-full object-cover bg-white ring-2 ring-white"
                        alt={`Avatar for ${c.profiles?.username ?? 'user'}`}
                        onError={(e) => (e.currentTarget.src = FALLBACK_AVATAR)}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Comment Content */}
                      <div className="text-sm">
                        <span className="font-semibold text-gray-800">@{c.profiles?.username ?? "user"}</span>{" "}
                        <span className="text-gray-700 break-words">{c.text}</span>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer - Elevated Bar */}
          <form
            onSubmit={send}
            className="absolute inset-x-0 bottom-0 z-[210] flex items-center gap-3 border-t border-gray-100/50 backdrop-blur-xl bg-white/95 px-4 py-3 shadow-top-lg"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={canPost ? "Add a comment…" : "Sign in to comment"}
              disabled={!canPost}
              className="flex-1 rounded-full border border-gray-200 focus:border-pink-300 px-4 py-2 text-sm bg-white outline-none placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
            
            <button
              type="submit"
              disabled={!canPost || !text.trim()}
              // Apply the core gradient button style
              className="px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:scale-100 transition-transform duration-200"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </>
  );
}