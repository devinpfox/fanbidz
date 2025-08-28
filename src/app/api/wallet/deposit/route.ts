import { NextResponse } from "next/server";
import { cookies as nextCookies } from "next/headers"; // 👈 alias
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../types/supabase";
import Stripe from "stripe";

export const runtime = "nodejs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  // ✅ Call/await cookies() once, then provide a function that returns that store.
  //    This avoids Next’s “cookies() should be awaited” runtime error inside the helper.
  const cookieStore = await nextCookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore as any, // cast to satisfy older helper types
  });

  const { amount } = await req.json();

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const coins = Math.floor(amount);
  if (coins < 1 || coins > 10_000) {
    return NextResponse.json({ error: "Amount out of range" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "OnlyBidz Coins" },
          unit_amount: 100,
        },
        quantity: coins,
      },
    ],
    metadata: {
      type: "wallet_deposit",
      user_id: user.id,
      coins: String(coins),
    },
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}
