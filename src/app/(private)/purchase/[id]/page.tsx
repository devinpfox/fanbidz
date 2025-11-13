// app/purchase/[id]/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies as nextCookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../types/supabase";
import OrderChat from "@/components/OrderChat";

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id, buyer_id, seller_id, price, status, created_at, shipped_at,
      tracking_number, shipping,
      listings:listing_id ( title, images ),
      seller:profiles!orders_seller_id_fkey ( id, username, avatar )
    `)
    .eq("id", params.id)
    .eq("buyer_id", userId)
    .maybeSingle();

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 text-red-600">
        {error.message}
      </div>
    );
  }

  if (!order) return notFound();

  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/800";
  const title = order.listings?.title ?? "Item";
  const shipped = order.status === "shipped";

  type Ship = {
    name?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    carrier?: string;
  };

  const ship: Ship =
    order.shipping && typeof order.shipping === "object" && !Array.isArray(order.shipping)
      ? (order.shipping as Ship)
      : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="h-16 max-w-md mx-auto flex items-center px-6">
          <Link href="/purchases" className="text-sm text-gray-500 hover:text-black transition">
            ← Back to purchases
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-8">

        {/* ---------------- PRODUCT CARD ---------------- */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-md overflow-hidden">
          <img
            src={img}
            alt=""
            className="w-full aspect-square object-cover"
          />

          <div className="p-5 space-y-4">
            {/* Title Row */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold leading-tight">{title}</h1>
                <p className="text-sm text-gray-500">
                  Ordered on {new Date(order.created_at!).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-800">
                  ${Number(order.price).toFixed(2)}
                </div>

                <div
                  className={`
                    mt-1 text-xs px-2 py-1 rounded-full
                    ${shipped
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-800"
                    }
                  `}
                >
                  {shipped ? "Shipped" : "Processing"}
                </div>
              </div>
            </div>

            {/* ---------------- SHIPPING ---------------- */}
            <div className="pt-2">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Shipping</h2>

              <div className="rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/40 p-4 space-y-1 text-sm">
                {ship.address_line1 ? (
                  <>
                    <div className="font-medium text-gray-800">{ship.name}</div>
                    <div>
                      {ship.address_line1}
                      {ship.address_line2 ? `, ${ship.address_line2}` : ""}
                    </div>
                    <div>
                      {ship.city}
                      {ship.state ? `, ${ship.state}` : ""} {ship.postal_code}
                    </div>
                    <div>{ship.country}</div>
                    {ship.phone && (
                      <div className="text-gray-500">{ship.phone}</div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">No address added yet.</span>
                    <Link
                      href={`/purchase/${order.id}/shipping`}
                      className="text-[rgb(255,78,207)] underline"
                    >
                      Add now
                    </Link>
                  </div>
                )}
              </div>

              {/* Tracking mini-grid */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                <div className="rounded-xl bg-gray-50/80 p-3">
                  <div className="text-gray-500 text-xs">Carrier</div>
                  <div>{ship.carrier ?? "—"}</div>
                </div>
                <div className="rounded-xl bg-gray-50/80 p-3 break-all">
                  <div className="text-gray-500 text-xs">Tracking</div>
                  <div>{order.tracking_number ?? "—"}</div>
                </div>
                <div className="rounded-xl bg-gray-50/80 p-3">
                  <div className="text-gray-500 text-xs">Status</div>
                  <div>{shipped ? "Shipped" : "Awaiting"}</div>
                </div>
              </div>
            </div>

            {/* ---------------- SELLER ---------------- */}
            <div className="pt-2 flex items-center gap-2 text-sm">
              <img
                src={order.seller?.avatar ?? "https://i.pravatar.cc/40"}
                className="w-7 h-7 rounded-full object-cover"
                alt=""
              />
              <span className="text-gray-500">Seller:</span>
              <span className="font-medium">@{order.seller?.username ?? "seller"}</span>
            </div>
          </div>
        </div>

        {/* ---------------- MESSAGING ---------------- */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-md overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-lg font-semibold">Messages</h2>
            <p className="text-sm text-gray-500">
              Chat with the seller about your order.
            </p>
          </div>

          <OrderChat orderId={order.id} meId={userId} otherId={order.seller_id!} />
        </div>

      </div>
    </div>
  );
}
