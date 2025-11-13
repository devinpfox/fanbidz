import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json, TablesInsert } from "@/types/supabase";

type PublicSchema = Database["public"];
type TransactionInsert = TablesInsert<"transactions">;
type WalletInsert = TablesInsert<"wallets">;

export async function POST(req: Request) {
  const { listing_id } = await req.json();
  if (!listing_id || typeof listing_id !== "string") {
    return NextResponse.json({ error: "Invalid listing_id" }, { status: 400 });
  }

  const cookieStore = cookies();
  const userClient = createRouteHandlerClient<PublicSchema>({
    cookies: () => cookieStore,
  });

  // ✅ FIX HERE — use <Database>, not <PublicSchema>
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: listing, error: lErr } = await userClient
    .from("listings")
    .select("id, end_at, sold, last_bid, user_id, userid")
    .eq("id", listing_id)
    .single();

  if (lErr || !listing)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sold)
    return NextResponse.json({ ok: true, note: "Already settled" });

  if (!listing.end_at || new Date(listing.end_at) > new Date()) {
    return NextResponse.json({ error: "Auction not ended yet" }, { status: 400 });
  }

  const { data: top } = await userClient
    .from("bids")
    .select("user_id, amount")
    .eq("listing_id", listing_id)
    .order("amount", { ascending: false })
    .limit(1)
    .single();

  if (!top || !top.user_id) {
    await userClient.from("listings").update({ sold: true }).eq("id", listing_id);
    return NextResponse.json({ ok: true, note: "No bids; marked sold" });
  }

  const creatorId = (listing.user_id ?? listing.userid) as string | undefined;
  if (!creatorId) {
    return NextResponse.json(
      { error: "Listing missing creator user_id" },
      { status: 400 }
    );
  }

  const payout = Number(top.amount ?? 0);

  const { data: creatorWallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", creatorId)
    .single();

  const cBal = Number(creatorWallet?.balance ?? 0);

  await admin
    .from("wallets")
    .upsert(
      { user_id: creatorId, balance: cBal + payout } satisfies WalletInsert,
      { onConflict: "user_id" }
    );

  const metadata: Json = { listing_id, kind: "auction_settle" };

  await admin
    .from("transactions")
    .insert([
      {
        user_id: creatorId,
        amount: payout,
        type: "payout",
        metadata,
      } satisfies TransactionInsert,
    ]);

  const { error: uErr } = await userClient
    .from("listings")
    .update({ sold: true })
    .eq("id", listing_id);

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, winner: top.user_id, payout });
}
