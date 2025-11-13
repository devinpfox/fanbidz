// app/api/orders/[id]/shipping/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../../../types/supabase";

type ShippingAddress = {
  name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as ShippingAddress;

  // Ensure this order belongs to the buyer making the request
  const { data: order, error: getErr } = await supabase
    .from("orders")
    .select("id, buyer_id, shipping")
    .eq("id", params.id)
    .maybeSingle<{
      id: string;
      buyer_id: string;
      shipping: any;
    }>();

  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 });
  if (!order || order.buyer_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Merge with existing shipping JSON (if any)
  const current =
    order.shipping && typeof order.shipping === "object" && !Array.isArray(order.shipping)
      ? (order.shipping as ShippingAddress)
      : {};
  const next: ShippingAddress = { ...current, ...body };

  const { error: updErr } = await supabase
    .from("orders")
    // @ts-expect-error - Type inference issue with @supabase/auth-helpers-nextjs v0.10.0
    .update({ shipping: next })
    .eq("id", params.id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
