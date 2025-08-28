import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../types/supabase.js";
import { cookies as nextCookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await nextCookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });

  const { order_id, tracking_carrier, tracking_number } = await req.json();

  if (!order_id) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  // auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // make sure the order belongs to this seller
  const { data: order } = await supabase
    .from("orders")
    .select("id, seller_id")
    .eq("id", order_id)
    .maybeSingle();

  if (!order || order.seller_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      tracking_carrier: tracking_carrier ?? null,
      tracking_number: tracking_number ?? null,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", order_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
