"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";

type Row = {
  id: string;
  listing_id?: string; // present in payload.new
  user_id: string;
  body: string;
  created_at: string;
  profiles: { username: string | null; avatar: string | null } | null;
};

export default function Comments({
  listingId,
  userId,
  initialCount = 0,
}: {
  listingId: string;
  userId: string | null;
  initialCount?: number;
}) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [text, setText] = useState("");
  const [count, setCount] = useState(initialCount);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase
        .from("comments")
        .select(
          "id, body, created_at, user_id, profiles:profiles!user_id ( username, avatar )"
        )
        .eq("listing_id", listingId)
        .order("created_at", { ascending: true });

      if (alive) setRows((data as any as Row[]) ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    })();

    const channel = supabase
      .channel(`comments-${listingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `listing_id=eq.${listingId}` },
        (payload) => {
          setRows((r) => [...r, payload.new as any as Row]);
          setCount((c) => c + 1);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [listingId, supabase]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    if (!userId) {
      router.push("/login");
      return;
    }
    setText("");
    await supabase.from("comments").insert({
      listing_id: listingId,
      user_id: userId,
      body,
    } as any);
    // Realtime handler appends it
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-md font-semibold">Comments</h2>
        <span className="text-sm text-gray-500">{count}</span>
      </div>

      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="flex gap-3">
            <img
              src={c.profiles?.avatar ?? "https://i.pravatar.cc/40"}
              className="w-7 h-7 rounded-full object-cover"
              alt=""
            />
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium">@{c.profiles?.username ?? "user"}</span>{" "}
                {c.body}
              </div>
              <div className="text-[11px] text-gray-500">
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Add a comment…"
          className="flex-1 border border-gray-300 px-3 py-2 rounded-md text-sm"
          maxLength={500}
        />
        <button
          type="button"
          onClick={send}
          className="bg-black text-white text-sm px-4 py-2 rounded-md"
        >
          Post
        </button>
      </div>
    </div>
  );
}
