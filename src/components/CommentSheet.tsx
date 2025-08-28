"use client";

import { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
type CommentItem = CommentRow & {
  profiles?: { username: string | null; avatar: string | null } | null;
};

export default function CommentSheet({
  listingId,
  currentUserId,        // pass this from the launcher
  onClose,               // launcher unmounts the sheet
}: {
  listingId: string;
  currentUserId?: string | null;
  onClose: () => void;
}) {
  const supabase = createClientComponentClient<Database>();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // load + subscribe
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, text, created_at, user_id, listing_id, profiles:profiles!comments_user_id_fkey(username, avatar)"
        )
        .eq("listing_id", listingId)
        .order("created_at", { ascending: true });

      if (!alive) return;
      if (!error) setItems((data as CommentItem[]) ?? []);
      // scroll to bottom after first paint
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 0);
    })();

    const channel = supabase
      .channel(`comments-${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `listing_id=eq.${listingId}` },
        (payload) => {
          setItems((p) => [...p, payload.new as CommentItem]);
          setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 0);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [listingId, supabase]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const txt = text.trim();
    if (!txt || !currentUserId) return;

    // optimistic append
    const tmp: CommentItem = {
      id: `tmp-${Date.now()}`,
      created_at: new Date().toISOString(),
      listing_id: listingId,
      user_id: currentUserId,
      text: txt,
      profiles: undefined,
    };

    setItems((p) => [...p, tmp]);
    setText("");

    const { error } = await supabase.from("comments").insert({
      listing_id: listingId,
      user_id: currentUserId,
      text: txt,
    } as CommentInsert);

    if (error) {
      setItems((p) => p.filter((i) => i.id !== tmp.id));
      alert(error.message || "Failed to comment");
    }
  }

  const canPost = !!currentUserId;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[180] bg-black/40" onClick={onClose} />

      {/* Sheet container – stop clicks from bubbling to the backdrop */}
      <div className="fixed inset-x-0 bottom-0 z-[200]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-full max-w-[720px] max-h-[85vh] rounded-t-2xl bg-white shadow-2xl relative flex flex-col">
          {/* Header */}
          <div className="flex h-12 items-center justify-between border-b px-4">
            <h3 className="text-base font-semibold">Comments</h3>
            <button onClick={onClose} aria-label="Close" className="text-2xl leading-none px-2">
              ×
            </button>
          </div>

          {/* List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-28">
            {items.length === 0 ? (
              <p className="text-gray-500">Be the first to comment.</p>
            ) : (
              <div className="space-y-3">
                {items.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <img
                      src={c.profiles?.avatar ?? "https://i.pravatar.cc/40"}
                      className="h-7 w-7 rounded-full object-cover"
                      alt=""
                    />
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">@{c.profiles?.username ?? "user"}</span>{" "}
                        {c.text}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={send}
            className="absolute inset-x-0 bottom-0 z-[210] flex items-center gap-2 border-t bg-white px-3 py-2"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={canPost ? "Add a comment…" : "Sign in to comment"}
              disabled={!canPost}
              className="flex-1 rounded-full border px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!canPost || !text.trim()}
              className="rounded-full bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
