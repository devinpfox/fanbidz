import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// service role client (server-only)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;
    const coinsStr = session.metadata?.coins;
    const coins = parseInt(coinsStr || "0", 10);

    if (!userId || !coins || coins <= 0) {
      return NextResponse.json({ ok: true });
    }

    // 1) Idempotent insert
    const { error: txErr } = await admin
      .from("wallet_transactions")
      .insert({ user_id: userId, session_id: session.id, coins })
      .select()
      .single();

    if (txErr?.code === "23505") {
      // Already processed
      return NextResponse.json({ ok: true });
    }
    if (txErr) {
      console.error(txErr);
      return NextResponse.json({ error: txErr.message }, { status: 500 });
    }

    // 2) Increment wallet balance
    const { error: updErr } = await admin.rpc("increment_wallet", {
      p_user_id: userId,
      p_delta: coins,
    });

    if (updErr) {
      console.error(updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
