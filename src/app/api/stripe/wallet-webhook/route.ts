// app/api/stripe/wallet-webhook/route.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../types/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_WALLET!
    );
  } catch (err: any) {
    console.error("❌ Invalid signature:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  // 🔔 Log every incoming event
  console.log("🔔 Stripe event:", event.type, "id:", event.id);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    console.log("🧾 Session completed:", session.id, "metadata:", meta);

    if (meta.type === "wallet_deposit" && meta.user_id && meta.coins) {
      const userId = String(meta.user_id);
      const coins = Number(meta.coins);

      try {
        // ensure wallet
        await admin.from("wallets").upsert(
          { user_id: userId, balance: 0 },
          { onConflict: "user_id" }
        );

        // fetch balance
        const { data: wallet, error: wErr } = await admin
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .single();
        if (wErr) console.error("Wallet fetch error:", wErr);

        const current = Number(wallet?.balance ?? 0);

        // credit and log
        await admin
          .from("wallets")
          .update({ balance: current + coins })
          .eq("user_id", userId);

        await admin.from("transactions").insert({
          user_id: userId,
          amount: coins,
          type: "deposit",
          metadata: { session_id: session.id },
        });

        // ✅ Success log
        console.log(
          "✅ Credited",
          coins,
          "coins to",
          userId,
          "for session",
          session.id,
          "→ new balance ~",
          current + coins
        );
      } catch (e: any) {
        console.error("💥 Wallet credit failed:", e?.message || e);
      }
    } else {
      console.log("ℹ️ Session not a wallet_deposit or missing metadata, skipping.");
    }
  }

  return new Response("ok", { status: 200 });
}
