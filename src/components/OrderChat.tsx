"use client";

import { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";

type Msg = {
  id: string;
  order_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

export default function OrderChat({
  orderId,
  meId,
  otherId,
}: {
  orderId: string;
  meId: string;
  otherId: string;
}) {
  const supabase = createClientComponentClient<Database>();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // initial fetch
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      setMsgs((data as Msg[]) ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    })();
    // realtime
    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMsgs((m) => [...m, payload.new as Msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    await supabase.from("order_messages").insert({
      order_id: orderId,
      sender_id: meId,
      body,
    } as any);
  }

  return (
    <div className="flex flex-col h-[420px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm
                ${mine ? "bg-black text-white" : "bg-gray-100 text-gray-900"}`}>
                <div>{m.body}</div>
                <div className="text-[10px] opacity-60 mt-1">
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 border rounded-full px-3 py-2 text-sm"
          placeholder="Write a message…"
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-full bg-black text-white text-sm font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
