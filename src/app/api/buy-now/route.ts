// app/api/buy-now/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../types/supabase";

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient<Database>({ cookies });
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service key is fine here too
  );

  const { listing_id } = await req.json();
  if (!listing_id || typeof listing_id !== "string") {
    return NextResponse.json({ error: "Invalid listing_id" }, { status: 400 });
  }

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: orderId, error } = await admin.rpc("buy_now_tx", {
    p_listing: listing_id,
    p_buyer: user.id,
  });

  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("already_sold")) return NextResponse.json({ error: "Already sold" }, { status: 409 });
    if (msg.includes("insufficient_funds")) return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
    if (msg.includes("no_buy_now_price")) return NextResponse.json({ error: "No Buy Now price" }, { status: 400 });
    if (msg.includes("not_found")) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order_id: orderId });
}
