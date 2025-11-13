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
  _optimistic?: boolean;
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
  const supabase = createClientComponentClient<Database["public"]>();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------------------
     INITIAL FETCH
  -------------------------------------------------------- */
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const { data } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!ignore) {
        setMsgs((data as Msg[]) ?? []);
        requestAnimationFrame(() =>
          bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        );
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [orderId]); // DON'T include supabase

  /* -------------------------------------------------------
     REALTIME SUBSCRIPTION
  -------------------------------------------------------- */
  useEffect(() => {
    // EXTREMELY IMPORTANT: unique channel per order
    const channel = supabase.channel(`order-messages-${orderId}`, {
      config: {
        broadcast: { ack: true }, // more reliable delivery
      },
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "order_messages",
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        const newMsg = payload.new as Msg;

        setMsgs((prev) => {
          const optimisticMatch = prev.find(
            (m) =>
              m._optimistic &&
              m.sender_id === newMsg.sender_id &&
              m.body === newMsg.body
          );

          if (optimisticMatch) {
            return prev
              .filter((m) => !m._optimistic)
              .concat({ ...newMsg, _optimistic: false });
          }

          return [...prev, newMsg];
        });

        requestAnimationFrame(() =>
          bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        );
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]); // NOT supabase

  /* -------------------------------------------------------
     SEND MESSAGE
  -------------------------------------------------------- */
  async function send() {
    const body = text.trim();
    if (!body) return;

    // optimistic bubble
    const optimistic: Msg = {
      id: `optimistic-${Date.now()}`,
      order_id: orderId,
      sender_id: meId,
      body,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    setMsgs((prev) => [...prev, optimistic]);
    setText("");

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    // actual DB write
    await supabase.from("order_messages").insert({
      order_id: orderId,
      sender_id: meId,
      body,
    });
  }

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  supabase.auth.getSession().then(res => console.log("CLIENT SESSION", res));
  return (
    <div className="flex flex-col h-[420px] bg-white/60 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.map((m) => {
          const mine = m.sender_id === meId;

          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                  max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm
                  backdrop-blur-xl 
                  ${
                    mine
                      ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white"
                      : "bg-white/70 border border-white/30 text-gray-900"
                  }
                  ${m._optimistic ? "opacity-70" : ""}
                `}
              >
                <div className="whitespace-pre-line">{m.body}</div>
                <div
                  className={`text-[10px] mt-1 opacity-70 ${
                    mine ? "text-white" : "text-gray-600"
                  }`}
                >
                  {new Date(m.created_at).toLocaleString()}
                  {m._optimistic ? " • sending…" : ""}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/20 bg-white/50 backdrop-blur-xl p-3 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a message…"
          className="
            flex-1 px-4 py-2 rounded-full text-sm 
            bg-white/80 backdrop-blur border border-white/30
            shadow-inner focus:outline-none focus:ring-2
            focus:ring-pink-400/40
          "
        />

        <button
          onClick={send}
          className="
            px-5 py-2 rounded-full text-sm font-semibold text-white
            bg-gradient-to-r from-fuchsia-600 to-pink-600
            shadow hover:opacity-90 transition disabled:opacity-40
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}
