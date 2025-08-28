import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../types/supabase";

export async function POST(req: Request) {
  const { listing_id } = await req.json();
  if (!listing_id || typeof listing_id !== "string") {
    return NextResponse.json({ error: "Invalid listing_id" }, { status: 400 });
  }

  const userClient = createRouteHandlerClient<Database>({ cookies });
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Load listing (note: select user_id + userid to support either column)
  const { data: listing, error: lErr } = await userClient
    .from("listings")
    .select("id, end_at, sold, last_bid, user_id, userid")
    .eq("id", listing_id)
    .single();

  if (lErr || !listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sold) return NextResponse.json({ ok: true, note: "Already settled" });

  if (!listing.end_at || new Date(listing.end_at) > new Date()) {
    return NextResponse.json({ error: "Auction not ended yet" }, { status: 400 });
  }

  // Highest bid (winner)
  const { data: top } = await userClient
    .from("bids")
    .select("user_id, amount")
    .eq("listing_id", listing_id)
    .order("amount", { ascending: false })
    .limit(1)
    .single();

  // If no bids, just mark sold (or skip — your call)
  if (!top || !top.user_id) {
    await userClient.from("listings").update({ sold: true } as any).eq("id", listing_id);
    return NextResponse.json({ ok: true, note: "No bids; marked sold" });
  }

  // Determine creator id from your schema
  const creatorId = (listing.user_id ?? listing.userid) as string | undefined;
  if (!creatorId) {
    return NextResponse.json({ error: "Listing missing creator user_id" }, { status: 400 });
  }

  const payout = Number(top.amount ?? 0);

  // Credit creator wallet (service role bypasses RLS)
  const { data: creatorWallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", creatorId)
    .single();

  const cBal = Number(creatorWallet?.balance ?? 0);

  await admin
    .from("wallets")
    .upsert({ user_id: creatorId, balance: cBal + payout }, { onConflict: "user_id" });

  await admin.from("transactions").insert({
    user_id: creatorId,
    amount: payout,
    type: "payout",
    metadata: { listing_id, kind: "auction_settle" },
  });

  // Finalize listing. (Only set fields that exist in your schema.)
  const { error: uErr } = await userClient
    .from("listings")
    .update({
      sold: true,
      // If you add these columns later, uncomment:
      // buyer_id: top.user_id,
      // sold_price: payout,
    } as any)
    .eq("id", listing_id);

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, winner: top.user_id, payout });
}
