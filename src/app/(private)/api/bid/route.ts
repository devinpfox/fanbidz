// app/api/bid/route.ts
import { NextResponse } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../../../../../types/supabase";

export const runtime = "nodejs";
type Listing = Pick<Tables<"listings">, "id" | "end_at" | "sold" | "last_bid">;

export async function POST(req: Request) {
  const cookieStore = await nextCookies(); // ✅ await
  const userClient = createRouteHandlerClient<Database>({
    cookies: () => cookieStore as any, // satisfy helper’s type
  });

  // Admin client for cross-user wallet ops (refunds/holds)
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // make sure this is set in .env.local
  );

  const { listing_id, amount } = await req.json();

  // Params
  if (!listing_id || typeof listing_id !== "string" || typeof amount !== "number" || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 });
  }
  if (amount <= 0) {
    return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
  }

  // Auth
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load listing
  const { data: listing, error: listingError } = await userClient
  .from("listings")
  .select("id, end_at, sold, last_bid")
  .eq("id", listing_id)
  .single<Listing>();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.sold) {
    return NextResponse.json({ error: "Listing already sold" }, { status: 400 });
  }
  if (!listing.end_at) {
    return NextResponse.json({ error: "Listing has no end time" }, { status: 400 });
  }
  if (new Date(listing.end_at) <= new Date()) {
    return NextResponse.json({ error: "Auction ended" }, { status: 400 });
  }
  if (amount <= (listing.last_bid ?? 0)) {
    return NextResponse.json({ error: "Bid must be higher than current highest" }, { status: 400 });
  }

  // Current bidder wallet (admin to avoid RLS edge cases)
  const { data: myWallet, error: myWalletErr } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (myWalletErr || !myWallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 400 });
  }
  const myBal = Number(myWallet.balance ?? 0);
  if (myBal < amount) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  // Previous highest bidder (admin)
  const { data: lastBidder } = await admin
    .from("bids")
    .select("user_id, amount")
    .eq("listing_id", listing_id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle<{ user_id: string; amount: number }>();

  // Refund previous top bidder if different from current
  if (lastBidder?.user_id && lastBidder.user_id !== user.id) {
    const { data: prevWallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", lastBidder.user_id)
      .single();
    const prevBal = Number(prevWallet?.balance ?? 0);
    const refundAmt = Number(lastBidder.amount ?? 0);

    await admin.from("wallets")
      .update({ balance: prevBal + refundAmt } as any)
      .eq("user_id", lastBidder.user_id);

    await admin.from("transactions").insert({
      user_id: lastBidder.user_id,
      amount: refundAmt,
      type: "bid_release",
      metadata: { listing_id },
    });
  }

  // Hold coins from current bidder
  await admin.from("wallets")
    .update({ balance: myBal - amount } as any)
    .eq("user_id", user.id);

  await admin.from("transactions").insert({
    user_id: user.id,
    amount: -amount,
    type: "bid_hold",
    metadata: { listing_id },
  });

  // Insert bid (admin to avoid RLS headaches)
  const { error: bidError } = await admin
    .from("bids")
    .insert([{ listing_id, user_id: user.id, amount }]);

  if (bidError) {
    // Soft rollback the hold
    await admin.from("wallets")
      .update({ balance: myBal } as any)
      .eq("user_id", user.id);
    await admin.from("transactions").insert({
      user_id: user.id,
      amount,
      type: "bid_release",
      metadata: { listing_id, reason: "insert_failed" },
    });
    return NextResponse.json({ error: bidError.message }, { status: 500 });
  }

  // Update listing top bid
  const { error: updateError } = await admin
    .from("listings")
    .update({ last_bid: amount } as any)
    .eq("id", listing_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, last_bid: amount });
}
