import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../../types/supabase";

// Initialize Stripe and Supabase client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  if (!session_id) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  // Fetch Stripe session
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch (err) {
    console.error("❌ Stripe session fetch error:", err);
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Session not paid yet" }, { status: 400 });
  }

  const meta = session.metadata || {};
  const userId = String(meta.user_id);
  const coins = Number(meta.coins);

  if (meta.type !== "wallet_deposit" || !userId || !coins || coins <= 0) {
    return NextResponse.json({ error: "Invalid wallet_deposit session metadata" }, { status: 400 });
  }

  // Check for duplicate processing
  const { data: alreadyProcessed, error: checkErr } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("session_id", session.id)
    .maybeSingle();

  if (checkErr) {
    console.error("❌ Error checking wallet_transactions:", checkErr.message);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }

  if (alreadyProcessed) {
    return NextResponse.json({ ok: true, note: "Already credited" });
  }

  // ✅ Ensure wallet exists without overwriting balance
  await admin
    .from("wallets")
    .upsert(
      { user_id: userId, balance: 0 },
      {
        onConflict: "user_id",
        ignoreDuplicates: true,
      }
    );

  // 📦 Fetch current wallet balance
  const { data: wallet, error: walletErr } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (walletErr || !wallet) {
    console.error("❌ Error fetching wallet:", walletErr?.message || "No wallet found");
    return NextResponse.json({ error: "Could not read wallet balance" }, { status: 500 });
  }

  const current = Number(wallet.balance ?? 0);
  const newBalance = current + coins;

  // 💰 Update wallet balance
  const { error: updateErr } = await admin
    .from("wallets")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  if (updateErr) {
    console.error("❌ Failed to update wallet balance:", updateErr.message);
    return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
  }

  // 🧾 Insert into main transactions table
  const { error: txnErr } = await admin.from("transactions").insert({
    user_id: userId,
    amount: coins,
    type: "deposit",
    metadata: {
      session_id: session.id,
      source: "success_confirm",
    },
  });

  if (txnErr) {
    console.error("❌ Failed to insert transaction:", txnErr.message);
  }

  // 🔐 Insert into wallet_transactions for idempotency tracking
  const { error: walletTxErr } = await admin
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      session_id: session.id,
      coins,
    });

  if (walletTxErr) {
    console.error("❌ Failed to insert wallet_transactions:", walletTxErr.message);
  }

  return NextResponse.json({ ok: true, newBalance });
}
