// app/creator/orders/[id]/page.tsx

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../types/supabase";
import MarkShippedForm from "./MarkShippedForm";
import OrderChat from "@/components/OrderChat";
import { notFound, redirect } from "next/navigation";

/* ---------- Types ---------- */

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

type OrderRecord = {
  id: string;
  price: number;
  status: string;
  created_at: string | null;
  shipped_at?: string | null;
  buyer_id: string;
  seller_id: string;
  shipping: Shipping | null;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  tracking_status?: string | null;
  tracking_estimated?: string | null;
  tracking_last_event?: Record<string, any> | null;
  listings?: {
    title: string | null;
    images: string[] | null;
  } | null;
  buyer?: {
    id: string;
    username: string | null;
    avatar: string | null;
  } | null;
};

/* ---------- Page ---------- */

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  // AUTH
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return redirect("/login");
  const userId = session.user.id;

  // ORDER QUERY (seller view)
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id, price, status, created_at, shipped_at,
      buyer_id, seller_id,
      shipping,
      tracking_number, tracking_carrier, tracking_status, tracking_estimated, tracking_last_event,
      listings:listing_id ( title, images ),
      buyer:profiles!orders_buyer_id_fkey ( id, username, avatar )
    `
    )
    .eq("id", params.id)
    .eq("seller_id", userId)
    .maybeSingle<OrderRecord>();

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        {error.message}
      </div>
    );

  if (!order) return notFound();

  const shipped = order.status === "shipped";
  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/300";
  const ship = (order.shipping as Shipping) || {};
  const addr = ship.address || {};

  /* ---------- RENDER ---------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="h-16 px-6 flex items-center max-w-xl mx-auto">
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Order Details
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-8">

        {/* ---------- ORDER HEADER CARD ---------- */}
        <div className="
          rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl
          shadow-md shadow-black/5 p-5
        ">
          <div className="flex items-center gap-4">
            <img
              src={img}
              className="w-16 h-16 rounded-xl object-cover shadow"
              alt=""
            />

            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {order.listings?.title ?? "Listing"}
              </p>
              <p className="text-sm text-gray-500">
                Order •{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <span
              className={`
                text-xs px-3 py-1 rounded-full font-semibold 
                ${shipped
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow"
                  : "bg-gray-200 text-gray-700"}
              `}
            >
              {shipped ? "Shipped" : "To Ship"}
            </span>
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-white/40" />

          {/* ---------- SHIPPING ADDRESS ---------- */}
          <h3 className="text-sm font-semibold text-gray-700">Shipping Address</h3>
          <div className="mt-2 text-sm space-y-0.5 text-gray-800">
            <p>{ship.name ?? "—"}</p>
            <p>
              {addr.line1 ?? "—"}
              {addr.line2 ? `, ${addr.line2}` : ""}
            </p>
            <p>
              {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}
            </p>
            <p>{addr.country ?? ""}</p>
            <p>{ship.phone ?? ""}</p>
          </div>

          {/* ---------- TRACKING SUMMARY ---------- */}
          <div className="mt-5 grid sm:grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-white/60 backdrop-blur p-3 shadow">
              <div className="text-gray-500">Carrier</div>
              <div className="font-medium">
                {order.tracking_carrier ?? ship.carrier ?? "—"}
              </div>
            </div>

            <div className="rounded-xl bg-white/60 backdrop-blur p-3 shadow">
              <div className="text-gray-500">Tracking</div>
              <div className="break-all font-medium">
                {order.tracking_number ?? "—"}
              </div>
            </div>

            <div className="rounded-xl bg-white/60 backdrop-blur p-3 shadow">
              <div className="text-gray-500">Status</div>
              <div className="capitalize font-medium">
                {order.tracking_status ?? (shipped ? "shipped" : "awaiting")}
              </div>
            </div>
          </div>

          {/* ---------- TRACKING DETAIL ---------- */}
          {order.tracking_number && (
            <div className="
              mt-5 rounded-xl border border-white/30 bg-white/50 backdrop-blur-xl
              p-4 text-sm shadow
            ">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500">Current Status</div>
                  <div className="font-medium capitalize">
                    {order.tracking_status ?? "—"}
                  </div>
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
                <div className="mt-4 space-y-1">
                  <div className="text-gray-500">Last Update</div>

                  <div className="font-medium">
                    {order.tracking_last_event?.message ??
                      order.tracking_last_event?.status ??
                      "Update"}
                  </div>

                  <div className="text-gray-500">
                    {(() => {
                      const loc = order.tracking_last_event?.tracking_location || {};
                      return [loc.city, loc.state, loc.country]
                        .filter(Boolean)
                        .join(", ");
                    })()}
                  </div>

                  {order.tracking_last_event?.datetime && (
                    <div className="text-gray-500">
                      {new Date(order.tracking_last_event.datetime).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---------- MARK AS SHIPPED ---------- */}
          {!shipped && (
            <div className="mt-6 border-t border-white/50 pt-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Mark as shipped
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                Paste the carrier and tracking number.
              </p>

              <MarkShippedForm orderId={order.id} />
            </div>
          )}

          {shipped && (
            <div className="mt-6 rounded-xl bg-green-100 text-green-700 p-3 text-sm">
              ✓ Item Marked as Shipped{" "}
              {order.tracking_number ? `— #${order.tracking_number}` : ""}
            </div>
          )}
        </div>

        {/* ---------- CHAT ---------- */}
        <div className="
          rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl
          shadow-md shadow-black/5 overflow-hidden
        ">
          <div className="p-4 border-b border-white/30">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <p className="text-sm text-gray-500">
              Chat with @{order.buyer?.username ?? "buyer"} about this order.
            </p>
          </div>

          <OrderChat
            orderId={order.id}
            meId={userId}
            otherId={order.buyer_id!}
          />
        </div>
      </div>
    </div>
  );
}
