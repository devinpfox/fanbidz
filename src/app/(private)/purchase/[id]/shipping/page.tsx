// app/purchase/[id]/shipping/page.tsx
export const dynamic = "force-dynamic";

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../../types/supabase";
import { notFound } from "next/navigation";
import ShippingForm from "./shipping-form";

// near the top of the file
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


export default async function BuyerShippingPage({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore as any });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Buyer can view only their own order
  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, buyer_id, seller_id, price, status, created_at, shipping,
      listings:listing_id ( title, images )
    `)
    .eq("id", params.id)
    .maybeSingle();

    if (!order || order.buyer_id !== user.id) return notFound();

  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/300";
  const title = order.listings?.title ?? "Item";

  const ship: ShippingAddress =
  order.shipping && typeof order.shipping === "object" && !Array.isArray(order.shipping)
    ? (order.shipping as ShippingAddress)
    : {};


  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Shipping for your Order</h1>

      <div className="rounded-xl border p-4 mb-5 flex gap-3 items-center">
        <img src={img} className="w-16 h-16 rounded-md object-cover" alt="" />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-500">Order • {new Date(order.created_at!).toLocaleDateString()}</p>
        </div>
        <div className="font-semibold">${Number(order.price).toFixed(2)}</div>
      </div>

      <ShippingForm
  orderId={order.id}
  initial={{
    name:        ship.name        ?? "",
    phone:       ship.phone       ?? "",
    address_line1: ship.address_line1 ?? "",
    address_line2: ship.address_line2 ?? "",
    city:        ship.city        ?? "",
    state:       ship.state       ?? "",
    postal_code: ship.postal_code ?? "",
    country:     ship.country     ?? "",
  }}
/>
    </div>
  );
}
