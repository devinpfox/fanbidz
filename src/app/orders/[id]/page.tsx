// app/creator/orders/[id]/page.tsx

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import MarkShippedForm from "./MarkShippedForm";
import OrderChat from "@/components/OrderChat";
import { notFound, redirect } from "next/navigation";

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
  carrier?: string; // legacy fallback if you had it inside shipping
};

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore as any });

  // Auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return redirect("/login");
  const userId = session.user.id;

  // Query as SELLER so RLS passes; include tracking fields
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id, price, status, created_at, shipped_at,
      buyer_id, seller_id,
      shipping,
      tracking_number, tracking_carrier, tracking_status, tracking_estimated, tracking_last_event,
      listings:listing_id ( title, images ),
      buyer:profiles!orders_buyer_id_fkey ( id, username, avatar )
    `)
    .eq("id", params.id)
    .eq("seller_id", userId)
    .maybeSingle();

  if (error) return <div className="max-w-xl mx-auto p-6 text-red-600">{error.message}</div>;
  if (!order) return notFound();

  const shipped = order.status === "shipped";
  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/300";
  const ship = (order.shipping as unknown as Shipping) || {};
  const addr = ship.address || {};

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Order header */}
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

        {/* Shipping address */}
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

        {/* Tracking summary */}
        <div className="mt-4 grid sm:grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="text-gray-500">Carrier</div>
            <div>{order.tracking_carrier ?? ship.carrier ?? "—"}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="text-gray-500">Tracking</div>
            <div className="break-all">{order.tracking_number ?? "—"}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="text-gray-500">Status</div>
            <div className="capitalize">
              {order.tracking_status ?? (shipped ? "shipped" : "awaiting")}
            </div>
          </div>
        </div>

        {/* Live tracking detail */}
        {order.tracking_number && (
          <div className="mt-3 rounded-lg border p-3 text-sm bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500">Current Status</div>
                <div className="font-medium capitalize">{order.tracking_status ?? "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500">Est. Delivery</div>
                <div className="font-medium">
                  {order.tracking_estimated
                    ? new Date(order.tracking_estimated).toLocaleString()
                    : "—"}
                </div>
              </div>
            </div>

            {order.tracking_last_event && (
              <div className="mt-3">
                <div className="text-gray-500">Last Update</div>
                <div className="mt-1">
                  <div className="font-medium">
                    {(order.tracking_last_event as any)?.message
                      ?? (order.tracking_last_event as any)?.status
                      ?? "Update"}
                  </div>
                  <div className="text-gray-500">
                    {(() => {
                      const loc = (order.tracking_last_event as any)?.tracking_location || {};
                      return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
                    })()}
                  </div>
                  {(order.tracking_last_event as any)?.datetime && (
                    <div className="text-gray-500">
                      {new Date((order.tracking_last_event as any).datetime).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mark shipped form (seller only) */}
        {!shipped && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold">Mark as shipped</h2>
            <p className="text-sm text-gray-500">
              Paste the carrier and tracking number. We’ll fetch live updates automatically.
            </p>
            <MarkShippedForm orderId={order.id} />
          </div>
        )}

        {shipped && (
          <div className="mt-6 rounded-lg bg-green-50 text-green-800 p-3 text-sm">
            ✓ Item Marked as Shipped
            {order.tracking_number ? ` — #${order.tracking_number}` : ""}
            {(order.tracking_carrier ?? ship.carrier) ? ` (${order.tracking_carrier ?? ship.carrier})` : ""}
          </div>
        )}
      </div>

      {/* Messaging */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
          <p className="text-sm text-gray-500">
            Chat with @{order.buyer?.username ?? "buyer"} about this order.
          </p>
        </div>
        <div className="p-0">
          <OrderChat orderId={order.id} meId={userId} otherId={order.buyer_id!} />
        </div>
      </div>
    </div>
  );
}
