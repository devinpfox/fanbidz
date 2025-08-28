// app/purchase/[id]/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies as nextCookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import OrderChat from "@/components/OrderChat";

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore as any });

  // ✅ Auth: getSession + redirect if missing
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // ✅ Query bound to buyer_id so RLS passes
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id, buyer_id, seller_id, price, status, created_at, shipped_at, tracking_number, shipping,
      listings:listing_id ( title, images ),
      seller:profiles!orders_seller_id_fkey ( id, username, avatar )
    `)
    .eq("id", params.id)
    .eq("buyer_id", userId) // <-- important for RLS
    .maybeSingle();

  // Helpful error instead of silent 404 on query failures
  if (error) {
    return <div className="max-w-3xl mx-auto p-6 text-red-600">{error.message}</div>;
  }
  if (!order) return notFound();

  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/800";
  const title = order.listings?.title ?? "Item";
  const shipped = order.status === "shipped";

  type Ship = {
    name?: string; phone?: string;
    address_line1?: string; address_line2?: string;
    city?: string; state?: string; postal_code?: string; country?: string;
    carrier?: string;
  };
  const ship: Ship =
    order.shipping && typeof order.shipping === "object" && !Array.isArray(order.shipping)
      ? (order.shipping as Ship)
      : {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/purchases" className="text-sm text-gray-500">← Back to orders</Link>

      <div className="mt-3 rounded-xl border overflow-hidden bg-white">
        <img src={img} alt="" className="w-full aspect-square object-cover" />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              <p className="text-sm text-gray-500">
                Order • {new Date(order.created_at!).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold">${Number(order.price).toFixed(2)}</div>
              <div className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full
                ${shipped ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>
                {shipped ? "Shipped" : "Not shipped"}
              </div>
            </div>
          </div>

          {/* Shipping summary */}
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Shipping</h2>

            <div className="rounded-lg border p-3 text-sm space-y-1">
              {ship.address_line1 ? (
                <>
                  <div className="font-medium">{ship.name}</div>
                  <div>
                    {ship.address_line1}{ship.address_line2 ? `, ${ship.address_line2}` : ""}
                  </div>
                  <div>
                    {ship.city}{ship.state ? `, ${ship.state}` : ""} {ship.postal_code}
                  </div>
                  <div>{ship.country}</div>
                  {ship.phone && <div className="text-gray-500">{ship.phone}</div>}
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">No shipping address yet.</span>
                  <Link href={`/purchase/${order.id}/shipping`} className="text-blue-600 underline">
                    Add shipping info
                  </Link>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="text-gray-500">Carrier</div>
                <div>{ship.carrier ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="text-gray-500">Tracking</div>
                <div>{order.tracking_number ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="text-gray-500">Status</div>
                <div>{shipped ? "Shipped" : "Awaiting shipment"}</div>
              </div>
            </div>
          </div>

          {/* Seller pill */}
          <div className="mt-6 flex items-center gap-2 text-sm">
            <img
              src={order.seller?.avatar ?? "https://i.pravatar.cc/40"}
              className="w-6 h-6 rounded-full object-cover"
              alt=""
            />
            <span className="text-gray-500">Seller:</span>
            <span className="font-medium">@{order.seller?.username ?? "seller"}</span>
          </div>
        </div>
      </div>

      {/* Messaging thread */}
      <div className="mt-6 rounded-xl border bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
          <p className="text-sm text-gray-500">Chat with the seller about this order.</p>
        </div>
        <OrderChat orderId={order.id} meId={userId} otherId={order.seller_id!} />
      </div>
    </div>
  );
}
