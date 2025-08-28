// app/creator/orders/[id]/page.tsx (or your current path)
export const dynamic = "force-dynamic";

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import MarkShippedForm from "./MarkShippedForm";
import OrderChat from "@/components/OrderChat";

type Shipping = {
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  carrier?: string;
};

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore as any });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // ⬇️ Pull buyer_id and seller_id so we can authorize + chat
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id, price, status, created_at, tracking_number, shipping,
      buyer_id, seller_id,
      listings:listing_id ( title, images ),
      buyer:profiles!orders_buyer_id_fkey ( id, username, avatar )
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return <div className="max-w-xl mx-auto p-6 text-red-600">{error.message}</div>;
  }
  if (!order) {
    return <div className="max-w-xl mx-auto p-6">Order not found.</div>;
  }

  // Only the creator/seller can view this page
  if (order.seller_id !== user.id) {
    return <div className="max-w-xl mx-auto p-6 text-red-600">Not authorized.</div>;
  }

  const shipped = order.status === "shipped";
  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/300";
  const ship = (order.shipping as unknown as Shipping) || {};
  const addr = ship.address || {};

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Order header card */}
      <div className="rounded-xl border p-4 bg-white">
        <div className="flex items-center gap-3">
          <img src={img} className="w-14 h-14 rounded-md object-cover" alt="" />
          <div className="flex-1">
            <p className="font-semibold">{order.listings?.title ?? "Listing"}</p>
            <p className="text-sm text-gray-500">
              Order • {new Date(order.created_at!).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              shipped ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {shipped ? "Shipped" : "To Ship"}
          </span>
        </div>

        <hr className="my-4" />

        <h3 className="text-sm font-semibold text-gray-700">SHIPPING ADDRESS</h3>
        <div className="mt-2 text-sm">
          <p>{ship.name ?? "—"}</p>
          <p>
            {addr.line1 ?? "—"}
            {addr.line2 ? `, ${addr.line2}` : ""}
          </p>
          <p>{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}</p>
          <p>{addr.country ?? ""}</p>
          <p>{ship.phone ?? ""}</p>
        </div>

        {!shipped ? (
          <MarkShippedForm orderId={order.id} />
        ) : (
          <div className="mt-6 rounded-lg bg-green-50 text-green-800 p-3 text-sm">
            ✓ Item Marked as Shipped
            {order.tracking_number ? ` — #${order.tracking_number}` : ""}
            {ship?.carrier ? ` (${ship.carrier})` : ""}
          </div>
        )}
      </div>

      {/* Messaging panel (seller ↔ buyer) */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
          <p className="text-sm text-gray-500">
            Chat with the buyer @{order.buyer?.username ?? "buyer"} about this order.
          </p>
        </div>

        <div className="p-0">
          <OrderChat
            orderId={order.id}
            meId={user.id}              // the creator/seller (current user)
            otherId={order.buyer_id!}   // the buyer
          />
        </div>
      </div>
    </div>
  );
}
