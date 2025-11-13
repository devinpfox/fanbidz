import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../types/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  // Get session from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Session not paid yet" }, { status: 400 });
  }

  const meta = session.metadata || {};
  if (meta.type !== "wallet_deposit" || !meta.user_id || !meta.coins) {
    return NextResponse.json({ error: "Not a wallet_deposit session" }, { status: 400 });
  }

  const userId = String(meta.user_id);
  const coins = Number(meta.coins);

  // Idempotency: already processed?
  const { data: already } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("session_id", session.id)
    .maybeSingle();

  if (already) {
    return NextResponse.json({ ok: true, note: "Already credited" });
  }

  // Ensure wallet
  await admin.from("wallets").upsert({ user_id: userId, balance: 0 }, { onConflict: "user_id" });

  // Fetch current balance
  const { data: wallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();
  const current = Number(wallet?.balance ?? 0);

  // Credit and log
  await admin.from("wallets").update({ balance: current + coins }).eq("user_id", userId);
  await admin.from("transactions").insert({
    user_id: userId,
    amount: coins,
    type: "deposit",
    metadata: { session_id: session.id, source: "success_confirm" },
  });
  await admin.from("wallet_transactions").insert({
    user_id: userId,
    session_id: session.id,
    coins,
  });

  return NextResponse.json({ ok: true, newBalance: current + coins });
}
